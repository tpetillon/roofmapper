'use strict';

var store = require('store');

function Localization(target, texts, language, fallbackLanguage) {
    this._target = target;
    this._texts = texts;

    if (language != undefined) {
        this._language = language;
    } else {
        var storedLanguage = store.get('language');
        if (storedLanguage != undefined) {
            this._language = storedLanguage;
        } else {
            var browserLanguage = navigator.language || navigator.userLanguage;
            browserLanguage = browserLanguage.substr(0, 2);
            if (this._texts.config.availableLanguages.indexOf(browserLanguage) !== -1) {
                this._language = browserLanguage;
            } else {
                this._language = this._texts.config.defaultLanguage;
            }
        }
    }

    this._fallbackLanguage = fallbackLanguage ?
        fallbackLanguage : this._texts.config.defaultLanguage;

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
        get : function() {
            return this._language;
        },
        set : function(value) {
            if (this._texts.config.availableLanguages.indexOf(value) === -1) {
                return;
            }

            this._language = value;
            store.set('language', this._language);
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

    if (!this._texts.texts.hasOwnProperty(key)) {
        return;
    }

    var entry = this._texts.texts[key];
    
    var text = undefined;
    if (entry.hasOwnProperty(this._language)) {
        text = entry[this._language];
    } else if (entry.hasOwnProperty(this._fallbackLanguage)) {
        text = entry[this._fallbackLanguage];
    } 

    if (text !== undefined) {
        element.textContent = text;
    }
};

module.exports = Localization;
