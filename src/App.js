// This example is live editable
import React, { Component } from 'react';
import queryString from 'query-string';

import { Route, Link, withRouter } from 'react-router-dom';
import Main from './screen/Main';
import Landing from './screen/Landing';
import Auth from './screen/Auth';
import Success from './screen/Success';

class App extends Component {

  render() {
    if ( sessionStorage.getItem("accesstoken") && sessionStorage.getItem("userid") ) {
      return (
        <div className="App">
                <Route path='/' exact component={Main}/> 
                <Route path='/app' exact component={Main}/>
                <Route path='/auth' exact component={Auth}/>
                <Route path='/success' exact component={Success}/>
                <Route path='/test' exact component={Success}/>
                <Route path='/test2' exact component={Main}/>
        </div>
      );
    }
    else {
      return (
        <div className="App">
                <Route path='/' exact component={Landing}/> 
                <Route path='/app' exact component={Auth}/>
                <Route path='/auth' exact component={Auth}/>
                <Route path='/success' exact component={Success}/>
                <Route path='/test' exact component={Success}/>
                <Route path='/test2' exact component={Main}/>
        </div>
      );
    }

    
  }
}

export default App;