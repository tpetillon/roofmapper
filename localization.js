'use strict';

var Globalize = require('globalize');
var store = require('store');

function Localization(target, messages, language) {
    this._target = target;
    
    for (var i = 0; i < messages.length; i++) {
        Globalize.loadMessages(messages[i]);
    }

    if (language != undefined) {
        Globalize.locale(language);
    } else {
        var storedLanguage = store.get('language');
        if (storedLanguage != undefined) {
            Globalize.locale(storedLanguage);
        }
    }

    var that = this;

    this._elementObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            var newNodes = mutation.addedNodes;
            if (newNodes !== null) {
                newNodes.forEach(function(node) {
                    that._setTextRecursively(node);
                });
            }
        });   
    });

    this._elementObserver.observe(this._target, {
        childList : true,
        subtree : true
    });

    this._attributeObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.target.hasAttribute('l10n')) {
                that._setText(mutation.target);
            }
        });
    });

    this._attributeObserver.observe(this._target, {
        attributes : true,
        subtree : true,
        attributeFilter : [ 'l10n' ]
    });

    this._refreshTexts();
}

Object.defineProperties(Localization.prototype, {
    language : {
        set : function(value) {
            Globalize.locale(value);
            store.set('language', value);
            this._refreshTexts();
        }
    }
});

Localization.prototype._refreshTexts = function() {
    this._setTextRecursively(this._target);
}

Localization.prototype._setTextRecursively = function(node) {
    var that = this;

    if (node.hasAttribute && node.hasAttribute('l10n')) {
        this._setText(node);
    }

    if (node.hasChildNodes()) {
        var children = node.childNodes;
        for (var i = 0; i < children.length; i++) {
            that._setTextRecursively(children[i]);
        }
    }
};

Localization.prototype._setText = function(element) {
    var key = element.getAttribute('l10n');

    var formatter = undefined;
    var text;
    try {
        formatter = Globalize.messageFormatter(key);
        text = formatter();
    } catch (e) {
        console.error('Localization error: ', e);
        text = '!' + key + '!';
    }

    element.textContent = text;
};

module.exports = Localization;
