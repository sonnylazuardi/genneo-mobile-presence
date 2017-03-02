import Exponent from 'exponent';
import React from 'react';
import {
    AppRegistry,
    Platform,
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity
} from 'react-native';
import {createStore, applyMiddleware, combineReducers, bindActionCreators} from 'redux';
import {connect, Provider} from 'react-redux';
import thunk from 'redux-thunk'; 
import { createSelector } from 'reselect';

const SERVER_URL = `http://api.sonnylab.com/genneo`;

const initialPendaftar = {
    pendaftar: [],
    hadir: []
};
const pendaftarReducer = (state = initialPendaftar, action = {}) => {
    const {payload} = action;
    switch(action.type) {
        case 'RECEIVE_PENDAFTAR':
            return {...state, pendaftar: payload.pendaftar}
        case 'RECEIVE_HADIR':
            return {...state, hadir: payload.hadir}
        default:
            return state;
    }
};

const api = {
    get: (url, options) => {
        return fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        })
        .then(response => response.json()).then(data => {
            return data
        }).catch(err => console.log(err));
    },
    post: (url, params, options) => {
        return fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        }).then(response => response.json()).then(data => {
            return data;
        }).catch(err => console.log(err));
    }
}

//actions
const receivePendaftar = (pendaftar) => {
    return {
        type: 'RECEIVE_PENDAFTAR',
        payload: {
            pendaftar
        }
    }
};

const fetchPendaftar = () => {
    return (dispatch, getState) => {
        return api.get(`${SERVER_URL}/listpendaftar`).then(data => {
            dispatch(receivePendaftar(data));
            return data;
        });
    }
};

const addHadir = (pendaftar) => {
    return (dispatch, getState) => {
        return api.post(`${SERVER_URL}/presences`, {email: pendaftar.email}).then(data => {
            dispatch(receiveHadir(data));
            return data;
        });
    }
} 

const receiveHadir = (hadir) => {
    return {
        type: 'RECEIVE_HADIR',
        payload: {
            hadir
        }
    }
};

const fetchHadir = () => {
    return (dispatch, getState) => {
        return api.get(`${SERVER_URL}/presences`).then(data => {
            dispatch(receiveHadir(data));
            return data;
        });
    }
};

//selectros
const pendaftarSelector = state => state.pendaftar.pendaftar;
const hadirSelector = state => state.pendaftar.hadir;

const getHadir = (pendaftar, hadir) => {
    const pendaftarHadir = pendaftar.map(item => ({
        ...item, 
        hadir: (hadir.indexOf(item.email) !== -1)
    }));
    return pendaftarHadir;
};

const pendaftarHadirSelector = createSelector(
    pendaftarSelector,
    hadirSelector,
    getHadir
);

const reducers = combineReducers({
    pendaftar: pendaftarReducer
});

const store = createStore(
    reducers,
    applyMiddleware(thunk)
);

class App extends React.Component {
    render() {
        return (
            <Provider store={store}>
                <Pendaftar />  
            </Provider>
        );
    }
}

@connect(state => ({
    pendaftar: state.pendaftar,
    pendaftarHadir: pendaftarHadirSelector(state)
}))
class Pendaftar extends React.Component {
    componentDidMount() {
        // load list pendaftar
        this.props.dispatch(fetchHadir()).then(() => {
            this.props.dispatch(fetchPendaftar());
        });
    }
    onHadir = (pendaftar) => {
        this.props.dispatch(addHadir(pendaftar));
    };
    render() {
        return (
            <View style={styles.container}>
                <ScrollView>
                    {this.props.pendaftarHadir.map(pendaftar => {
                        return (
                            <View style={{paddingVertical: 10, borderWidth: 1, borderColor: '#eee'}}>
                                <Text>{pendaftar.nama}</Text>
                                <Text>{pendaftar.email}</Text>
                                <TouchableOpacity onPress={() => this.onHadir(pendaftar)}>
                                    {pendaftar.hadir ?
                                        <Text>Hadir</Text>
                                        : <Text>Tidak</Text>}
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </ScrollView>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
});

Exponent.registerRootComponent(App);
