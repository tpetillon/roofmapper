'use strict';

var Globalize = require('globalize');
var store = require('store');

function Localizer(target, messages) {
    this._target = target;
    
    this._availableLanguages = new Set();
    for (var i = 0; i < messages.length; i++) {
        Globalize.loadMessages(messages[i]);
        
        var languages = Object.keys(messages[i]);
        for (var j = 0; j < languages.length; j++) {
            this._availableLanguages.add(languages[j]);
        }
    }
    this._availableLanguages.delete('root');

    var storedLanguage = store.get('language');
    if (storedLanguage != undefined) {
        Globalize.locale(storedLanguage);
    } else if (navigator.languages) {
        for (var i = 0; i < navigator.languages.length; i++) {
            var language = navigator.languages[i];
            if (this._availableLanguages.has(language)) {
                Globalize.locale(language);
                break;
            }
        }
    }

    var that = this;

    this._elementObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            var newNodes = mutation.addedNodes;
            if (newNodes !== null) {
                newNodes.forEach(function(node) {
                    that.setTextFromAttributes(node);
                });
            }
        });   
    });

    this._elementObserver.observe(this._target, {
        childList : true
    });

    this._attributeObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (!mutation.attributeName.startsWith('l10n')) {
                return;
            }

            if (!mutation.target.hasAttribute(mutation.attributeName)) {
                // attribute has just been removed
                return;
            }

            var attributeName = mutation.attributeName;
            
            if (mutation.attributeName === 'l10n-params') {
                attributeName = 'l10n';
            } else {
                var match = /^l10n-params-(.+)/.exec(mutation.attributeName);
                if (match !== null) {
                    attributeName = 'l10n-attr-' + match[0];
                }
            }

            that.setTextFromAttribute(mutation.target, attributeName);
        });
    });

    this._attributeObserver.observe(this._target, {
        attributes : true,
        subtree : true
    });

    this.refreshTexts();
}

Object.defineProperties(Localizer.prototype, {
    language : {
        set : function(value) {
            if (this._availableLanguages.has(value)) {
                Globalize.locale(value);
                store.set('language', value);
                this.refreshTexts();
            }
        }
    }
});

Localizer.prototype.refreshTexts = function() {
    this.setTextFromAttributesRecursively(this._target);
}

Localizer.prototype.setTextFromAttributesRecursively = function(node) {
    var that = this;

    this.setTextFromAttributes(node);

    if (node.hasChildNodes()) {
        var children = node.childNodes;
        for (var i = 0; i < children.length; i++) {
            that.setTextFromAttributesRecursively(children[i]);
        }
    }
};

Localizer.prototype.setTextFromAttributes = function(element) {
    var attributes = element.attributes;
    
    if (attributes === undefined) {
        return;
    }

    for (var i = 0; i < attributes.length; i++) {
        var attribute = attributes[i];
        if (attribute.name === 'l10n' || attribute.name.match(/^l10n-attr-(.+)/)) {
            this.setTextFromAttribute(element, attribute.name);
        }
    }
};

Localizer.prototype.setTextFromAttribute = function(element, attributeName) {
    var translatedAttribute = undefined;
    var parametersAttribute = undefined;
    var parameters = {};

    if (attributeName === 'l10n') {
        parametersAttribute = 'l10n-params';
    } else {
        var match = /^l10n-attr-(.+)/.exec(attributeName);
        if (match !== null) {
            translatedAttribute = match[1];
            parametersAttribute = 'l10n-params-' + translatedAttribute;
        } else {
            console.error('wrong element/attribute combination: ', element, attributeName);
            return;
        }
    }

    if (!element.hasAttribute(attributeName)) {
        console.error('wrong element/attribute combination: ', element, attributeName);
        return;
    }
    
    var key = element.getAttribute(attributeName);
    
    if (element.hasAttribute(parametersAttribute)) {
        var paramJson = element.getAttribute(parametersAttribute);
        try {
            parameters = JSON.parse(paramJson);
        } catch (e) {
            console.error(
                'invalid localization parameter JSON string for element/attribute ',
                element, attributeName);
        }
    }

    var text = this.getText(key, parameters);

    if (translatedAttribute !== undefined) {
        element.setAttribute(translatedAttribute, text);
    } else {
        element.textContent = text;
    }
};

Localizer.prototype.getText = function(key, parameters) {
    var formatter = undefined;
    var text;
    try {
        formatter = Globalize.messageFormatter(key);
        if (formatter != null) {
            text = formatter(parameters);
        } else {
            text = '?' + key + '?';
        }
    } catch (e) {
        console.error('localization error: ', e);
        text = '!' + key + '!';
    }

    return text;
}

Localizer.prototype.formatDate = function(date) {
    return Globalize.formatDate(date, { datetime: 'medium' });
}

module.exports = Localizer;
