'use strict';

function LoadingStatus()
{
    this._systems = new Set();
    this._listeners = new Set();
}

Object.defineProperties(LoadingStatus.prototype, {
    isLoading : {
        get : function() {
            return this._systems.size !== 0;
        }
    }
});

LoadingStatus.prototype.addListener = function(listener) {
    this._listeners.add(listener);
};

LoadingStatus.prototype.removeListener = function(listener) {
    this._listeners.delete(listener);
};

LoadingStatus.prototype.addSystem = function(value) {
    if (!this._systems.has(value)) {
        this._systems.add(value);
        callListeners(this);
    }
};

LoadingStatus.prototype.removeSystem = function(value) {
    if (this._systems.has(value)) {
        this._systems.delete(value);
        callListeners(this);
    }
};

function callListeners(observableSet) {
    observableSet._listeners.forEach(function(listener) {
        listener(observableSet);
    });
}

module.exports = LoadingStatus;