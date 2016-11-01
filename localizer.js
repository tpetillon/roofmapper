'use strict';

var Globalize = require('globalize');
var store = require('store');

function Localizer(target, messages, language) {
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
                    that.setTextFromAttributesRecursively(node);
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
                that.setTextFromAttributes(mutation.target);
            }
        });
    });

    this._attributeObserver.observe(this._target, {
        attributes : true,
        subtree : true,
        attributeFilter : [ 'l10n', 'l10n-params' ]
    });

    this.refreshTexts();
}

Object.defineProperties(Localizer.prototype, {
    language : {
        set : function(value) {
            Globalize.locale(value);
            store.set('language', value);
            this.refreshTexts();
        }
    }
});

Localizer.prototype.refreshTexts = function() {
    this.setTextFromAttributesRecursively(this._target);
}

Localizer.prototype.setTextFromAttributesRecursively = function(node) {
    var that = this;

    if (node.hasAttribute && node.hasAttribute('l10n')) {
        this.setTextFromAttributes(node);
    }

    if (node.hasChildNodes()) {
        var children = node.childNodes;
        for (var i = 0; i < children.length; i++) {
            that.setTextFromAttributesRecursively(children[i]);
        }
    }
};

Localizer.prototype.setTextFromAttributes = function(element) {
    var key = element.getAttribute('l10n');
    var parameters = {};
    
    if (element.hasAttribute('l10n-params')) {
        var paramJson = element.getAttribute('l10n-params');
        try {
            parameters = JSON.parse(paramJson);
        } catch (e) {
            console.error('invalid localization parameter JSON string for element ', element);
        }
    }

    element.textContent = this.getText(key, parameters);
};

Localizer.prototype.getText = function(key, parameters) {
    var formatter = undefined;
    var text;
    try {
        formatter = Globalize.messageFormatter(key);
        text = formatter(parameters);
    } catch (e) {
        console.error('localization error: ', e);
        text = '!' + key + '!';
    }

    return text;
}

module.exports = Localizer;
