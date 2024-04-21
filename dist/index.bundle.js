(self["webpackChunkmodule_webpack_starter"] = self["webpackChunkmodule_webpack_starter"] || []).push([["index"],{

/***/ "./node_modules/@iconfu/svg-inject/dist/svg-inject.js":
/*!************************************************************!*\
  !*** ./node_modules/@iconfu/svg-inject/dist/svg-inject.js ***!
  \************************************************************/
/***/ ((module) => {

/**
 * SVGInject - Version 1.2.3
 * A tiny, intuitive, robust, caching solution for injecting SVG files inline into the DOM.
 *
 * https://github.com/iconfu/svg-inject
 *
 * Copyright (c) 2018 INCORS, the creators of iconfu.com
 * @license MIT License - https://github.com/iconfu/svg-inject/blob/master/LICENSE
 */

(function(window, document) {
  // constants for better minification
  var _CREATE_ELEMENT_ = 'createElement';
  var _GET_ELEMENTS_BY_TAG_NAME_ = 'getElementsByTagName';
  var _LENGTH_ = 'length';
  var _STYLE_ = 'style';
  var _TITLE_ = 'title';
  var _UNDEFINED_ = 'undefined';
  var _SET_ATTRIBUTE_ = 'setAttribute';
  var _GET_ATTRIBUTE_ = 'getAttribute';

  var NULL = null;

  // constants
  var __SVGINJECT = '__svgInject';
  var ID_SUFFIX = '--inject-';
  var ID_SUFFIX_REGEX = new RegExp(ID_SUFFIX + '\\d+', "g");
  var LOAD_FAIL = 'LOAD_FAIL';
  var SVG_NOT_SUPPORTED = 'SVG_NOT_SUPPORTED';
  var SVG_INVALID = 'SVG_INVALID';
  var ATTRIBUTE_EXCLUSION_NAMES = ['src', 'alt', 'onload', 'onerror'];
  var A_ELEMENT = document[_CREATE_ELEMENT_]('a');
  var IS_SVG_SUPPORTED = typeof SVGRect != _UNDEFINED_;
  var DEFAULT_OPTIONS = {
    useCache: true,
    copyAttributes: true,
    makeIdsUnique: true
  };
  // Map of IRI referenceable tag names to properties that can reference them. This is defined in
  // https://www.w3.org/TR/SVG11/linking.html#processingIRI
  var IRI_TAG_PROPERTIES_MAP = {
    clipPath: ['clip-path'],
    'color-profile': NULL,
    cursor: NULL,
    filter: NULL,
    linearGradient: ['fill', 'stroke'],
    marker: ['marker', 'marker-end', 'marker-mid', 'marker-start'],
    mask: NULL,
    pattern: ['fill', 'stroke'],
    radialGradient: ['fill', 'stroke']
  };
  var INJECTED = 1;
  var FAIL = 2;

  var uniqueIdCounter = 1;
  var xmlSerializer;
  var domParser;


  // creates an SVG document from an SVG string
  function svgStringToSvgDoc(svgStr) {
    domParser = domParser || new DOMParser();
    return domParser.parseFromString(svgStr, 'text/xml');
  }


  // searializes an SVG element to an SVG string
  function svgElemToSvgString(svgElement) {
    xmlSerializer = xmlSerializer || new XMLSerializer();
    return xmlSerializer.serializeToString(svgElement);
  }


  // Returns the absolute url for the specified url
  function getAbsoluteUrl(url) {
    A_ELEMENT.href = url;
    return A_ELEMENT.href;
  }


  // Load svg with an XHR request
  function loadSvg(url, callback, errorCallback) {
    if (url) {
      var req = new XMLHttpRequest();
      req.onreadystatechange = function() {
        if (req.readyState == 4) {
          // readyState is DONE
          var status = req.status;
          if (status == 200) {
            // request status is OK
            callback(req.responseXML, req.responseText.trim());
          } else if (status >= 400) {
            // request status is error (4xx or 5xx)
            errorCallback();
          } else if (status == 0) {
            // request status 0 can indicate a failed cross-domain call
            errorCallback();
          }
        }
      };
      req.open('GET', url, true);
      req.send();
    }
  }


  // Copy attributes from img element to svg element
  function copyAttributes(imgElem, svgElem) {
    var attribute;
    var attributeName;
    var attributeValue;
    var attributes = imgElem.attributes;
    for (var i = 0; i < attributes[_LENGTH_]; i++) {
      attribute = attributes[i];
      attributeName = attribute.name;
      // Only copy attributes not explicitly excluded from copying
      if (ATTRIBUTE_EXCLUSION_NAMES.indexOf(attributeName) == -1) {
        attributeValue = attribute.value;
        // If img attribute is "title", insert a title element into SVG element
        if (attributeName == _TITLE_) {
          var titleElem;
          var firstElementChild = svgElem.firstElementChild;
          if (firstElementChild && firstElementChild.localName.toLowerCase() == _TITLE_) {
            // If the SVG element's first child is a title element, keep it as the title element
            titleElem = firstElementChild;
          } else {
            // If the SVG element's first child element is not a title element, create a new title
            // ele,emt and set it as the first child
            titleElem = document[_CREATE_ELEMENT_ + 'NS']('http://www.w3.org/2000/svg', _TITLE_);
            svgElem.insertBefore(titleElem, firstElementChild);
          }
          // Set new title content
          titleElem.textContent = attributeValue;
        } else {
          // Set img attribute to svg element
          svgElem[_SET_ATTRIBUTE_](attributeName, attributeValue);
        }
      }
    }
  }


  // This function appends a suffix to IDs of referenced elements in the <defs> in order to  to avoid ID collision
  // between multiple injected SVGs. The suffix has the form "--inject-X", where X is a running number which is
  // incremented with each injection. References to the IDs are adjusted accordingly.
  // We assume tha all IDs within the injected SVG are unique, therefore the same suffix can be used for all IDs of one
  // injected SVG.
  // If the onlyReferenced argument is set to true, only those IDs will be made unique that are referenced from within the SVG
  function makeIdsUnique(svgElem, onlyReferenced) {
    var idSuffix = ID_SUFFIX + uniqueIdCounter++;
    // Regular expression for functional notations of an IRI references. This will find occurences in the form
    // url(#anyId) or url("#anyId") (for Internet Explorer) and capture the referenced ID
    var funcIriRegex = /url\("?#([a-zA-Z][\w:.-]*)"?\)/g;
    // Get all elements with an ID. The SVG spec recommends to put referenced elements inside <defs> elements, but
    // this is not a requirement, therefore we have to search for IDs in the whole SVG.
    var idElements = svgElem.querySelectorAll('[id]');
    var idElem;
    // An object containing referenced IDs  as keys is used if only referenced IDs should be uniquified.
    // If this object does not exist, all IDs will be uniquified.
    var referencedIds = onlyReferenced ? [] : NULL;
    var tagName;
    var iriTagNames = {};
    var iriProperties = [];
    var changed = false;
    var i, j;

    if (idElements[_LENGTH_]) {
      // Make all IDs unique by adding the ID suffix and collect all encountered tag names
      // that are IRI referenceable from properities.
      for (i = 0; i < idElements[_LENGTH_]; i++) {
        tagName = idElements[i].localName; // Use non-namespaced tag name
        // Make ID unique if tag name is IRI referenceable
        if (tagName in IRI_TAG_PROPERTIES_MAP) {
          iriTagNames[tagName] = 1;
        }
      }
      // Get all properties that are mapped to the found IRI referenceable tags
      for (tagName in iriTagNames) {
        (IRI_TAG_PROPERTIES_MAP[tagName] || [tagName]).forEach(function (mappedProperty) {
          // Add mapped properties to array of iri referencing properties.
          // Use linear search here because the number of possible entries is very small (maximum 11)
          if (iriProperties.indexOf(mappedProperty) < 0) {
            iriProperties.push(mappedProperty);
          }
        });
      }
      if (iriProperties[_LENGTH_]) {
        // Add "style" to properties, because it may contain references in the form 'style="fill:url(#myFill)"'
        iriProperties.push(_STYLE_);
      }
      // Run through all elements of the SVG and replace IDs in references.
      // To get all descending elements, getElementsByTagName('*') seems to perform faster than querySelectorAll('*').
      // Since svgElem.getElementsByTagName('*') does not return the svg element itself, we have to handle it separately.
      var descElements = svgElem[_GET_ELEMENTS_BY_TAG_NAME_]('*');
      var element = svgElem;
      var propertyName;
      var value;
      var newValue;
      for (i = -1; element != NULL;) {
        if (element.localName == _STYLE_) {
          // If element is a style element, replace IDs in all occurences of "url(#anyId)" in text content
          value = element.textContent;
          newValue = value && value.replace(funcIriRegex, function(match, id) {
            if (referencedIds) {
              referencedIds[id] = 1;
            }
            return 'url(#' + id + idSuffix + ')';
          });
          if (newValue !== value) {
            element.textContent = newValue;
          }
        } else if (element.hasAttributes()) {
          // Run through all property names for which IDs were found
          for (j = 0; j < iriProperties[_LENGTH_]; j++) {
            propertyName = iriProperties[j];
            value = element[_GET_ATTRIBUTE_](propertyName);
            newValue = value && value.replace(funcIriRegex, function(match, id) {
              if (referencedIds) {
                referencedIds[id] = 1;
              }
                return 'url(#' + id + idSuffix + ')';
            });
            if (newValue !== value) {
              element[_SET_ATTRIBUTE_](propertyName, newValue);
            }
          }
          // Replace IDs in xlink:ref and href attributes
          ['xlink:href', 'href'].forEach(function(refAttrName) {
            var iri = element[_GET_ATTRIBUTE_](refAttrName);
            if (/^\s*#/.test(iri)) { // Check if iri is non-null and internal reference
              iri = iri.trim();
              element[_SET_ATTRIBUTE_](refAttrName, iri + idSuffix);
              if (referencedIds) {
                // Add ID to referenced IDs
                referencedIds[iri.substring(1)] = 1;
              }
            }
          });
        }
        element = descElements[++i];
      }
      for (i = 0; i < idElements[_LENGTH_]; i++) {
        idElem = idElements[i];
        // If set of referenced IDs exists, make only referenced IDs unique,
        // otherwise make all IDs unique.
        if (!referencedIds || referencedIds[idElem.id]) {
          // Add suffix to element's ID
          idElem.id += idSuffix;
          changed = true;
        }
      }
    }
    // return true if SVG element has changed
    return changed;
  }


  // For cached SVGs the IDs are made unique by simply replacing the already inserted unique IDs with a
  // higher ID counter. This is much more performant than a call to makeIdsUnique().
  function makeIdsUniqueCached(svgString) {
    return svgString.replace(ID_SUFFIX_REGEX, ID_SUFFIX + uniqueIdCounter++);
  }


  // Inject SVG by replacing the img element with the SVG element in the DOM
  function inject(imgElem, svgElem, absUrl, options) {
    if (svgElem) {
      svgElem[_SET_ATTRIBUTE_]('data-inject-url', absUrl);
      var parentNode = imgElem.parentNode;
      if (parentNode) {
        if (options.copyAttributes) {
          copyAttributes(imgElem, svgElem);
        }
        // Invoke beforeInject hook if set
        var beforeInject = options.beforeInject;
        var injectElem = (beforeInject && beforeInject(imgElem, svgElem)) || svgElem;
        // Replace img element with new element. This is the actual injection.
        parentNode.replaceChild(injectElem, imgElem);
        // Mark img element as injected
        imgElem[__SVGINJECT] = INJECTED;
        removeOnLoadAttribute(imgElem);
        // Invoke afterInject hook if set
        var afterInject = options.afterInject;
        if (afterInject) {
          afterInject(imgElem, injectElem);
        }
      }
    } else {
      svgInvalid(imgElem, options);
    }
  }


  // Merges any number of options objects into a new object
  function mergeOptions() {
    var mergedOptions = {};
    var args = arguments;
    // Iterate over all specified options objects and add all properties to the new options object
    for (var i = 0; i < args[_LENGTH_]; i++) {
      var argument = args[i];
        for (var key in argument) {
          if (argument.hasOwnProperty(key)) {
            mergedOptions[key] = argument[key];
          }
        }
      }
    return mergedOptions;
  }


  // Adds the specified CSS to the document's <head> element
  function addStyleToHead(css) {
    var head = document[_GET_ELEMENTS_BY_TAG_NAME_]('head')[0];
    if (head) {
      var style = document[_CREATE_ELEMENT_](_STYLE_);
      style.type = 'text/css';
      style.appendChild(document.createTextNode(css));
      head.appendChild(style);
    }
  }


  // Builds an SVG element from the specified SVG string
  function buildSvgElement(svgStr, verify) {
    if (verify) {
      var svgDoc;
      try {
        // Parse the SVG string with DOMParser
        svgDoc = svgStringToSvgDoc(svgStr);
      } catch(e) {
        return NULL;
      }
      if (svgDoc[_GET_ELEMENTS_BY_TAG_NAME_]('parsererror')[_LENGTH_]) {
        // DOMParser does not throw an exception, but instead puts parsererror tags in the document
        return NULL;
      }
      return svgDoc.documentElement;
    } else {
      var div = document.createElement('div');
      div.innerHTML = svgStr;
      return div.firstElementChild;
    }
  }


  function removeOnLoadAttribute(imgElem) {
    // Remove the onload attribute. Should only be used to remove the unstyled image flash protection and
    // make the element visible, not for removing the event listener.
    imgElem.removeAttribute('onload');
  }


  function errorMessage(msg) {
    console.error('SVGInject: ' + msg);
  }


  function fail(imgElem, status, options) {
    imgElem[__SVGINJECT] = FAIL;
    if (options.onFail) {
      options.onFail(imgElem, status);
    } else {
      errorMessage(status);
    }
  }


  function svgInvalid(imgElem, options) {
    removeOnLoadAttribute(imgElem);
    fail(imgElem, SVG_INVALID, options);
  }


  function svgNotSupported(imgElem, options) {
    removeOnLoadAttribute(imgElem);
    fail(imgElem, SVG_NOT_SUPPORTED, options);
  }


  function loadFail(imgElem, options) {
    fail(imgElem, LOAD_FAIL, options);
  }


  function removeEventListeners(imgElem) {
    imgElem.onload = NULL;
    imgElem.onerror = NULL;
  }


  function imgNotSet(msg) {
    errorMessage('no img element');
  }


  function createSVGInject(globalName, options) {
    var defaultOptions = mergeOptions(DEFAULT_OPTIONS, options);
    var svgLoadCache = {};

    if (IS_SVG_SUPPORTED) {
      // If the browser supports SVG, add a small stylesheet that hides the <img> elements until
      // injection is finished. This avoids showing the unstyled SVGs before style is applied.
      addStyleToHead('img[onload^="' + globalName + '("]{visibility:hidden;}');
    }


    /**
     * SVGInject
     *
     * Injects the SVG specified in the `src` attribute of the specified `img` element or array of `img`
     * elements. Returns a Promise object which resolves if all passed in `img` elements have either been
     * injected or failed to inject (Only if a global Promise object is available like in all modern browsers
     * or through a polyfill).
     *
     * Options:
     * useCache: If set to `true` the SVG will be cached using the absolute URL. Default value is `true`.
     * copyAttributes: If set to `true` the attributes will be copied from `img` to `svg`. Dfault value
     *     is `true`.
     * makeIdsUnique: If set to `true` the ID of elements in the `<defs>` element that can be references by
     *     property values (for example 'clipPath') are made unique by appending "--inject-X", where X is a
     *     running number which increases with each injection. This is done to avoid duplicate IDs in the DOM.
     * beforeLoad: Hook before SVG is loaded. The `img` element is passed as a parameter. If the hook returns
     *     a string it is used as the URL instead of the `img` element's `src` attribute.
     * afterLoad: Hook after SVG is loaded. The loaded `svg` element and `svg` string are passed as a
     *     parameters. If caching is active this hook will only get called once for injected SVGs with the
     *     same absolute path. Changes to the `svg` element in this hook will be applied to all injected SVGs
     *     with the same absolute path. It's also possible to return an `svg` string or `svg` element which
     *     will then be used for the injection.
     * beforeInject: Hook before SVG is injected. The `img` and `svg` elements are passed as parameters. If
     *     any html element is returned it gets injected instead of applying the default SVG injection.
     * afterInject: Hook after SVG is injected. The `img` and `svg` elements are passed as parameters.
     * onAllFinish: Hook after all `img` elements passed to an SVGInject() call have either been injected or
     *     failed to inject.
     * onFail: Hook after injection fails. The `img` element and a `status` string are passed as an parameter.
     *     The `status` can be either `'SVG_NOT_SUPPORTED'` (the browser does not support SVG),
     *     `'SVG_INVALID'` (the SVG is not in a valid format) or `'LOAD_FAILED'` (loading of the SVG failed).
     *
     * @param {HTMLImageElement} img - an img element or an array of img elements
     * @param {Object} [options] - optional parameter with [options](#options) for this injection.
     */
    function SVGInject(img, options) {
      options = mergeOptions(defaultOptions, options);

      var run = function(resolve) {
        var allFinish = function() {
          var onAllFinish = options.onAllFinish;
          if (onAllFinish) {
            onAllFinish();
          }
          resolve && resolve();
        };

        if (img && typeof img[_LENGTH_] != _UNDEFINED_) {
          // an array like structure of img elements
          var injectIndex = 0;
          var injectCount = img[_LENGTH_];

          if (injectCount == 0) {
            allFinish();
          } else {
            var finish = function() {
              if (++injectIndex == injectCount) {
                allFinish();
              }
            };

            for (var i = 0; i < injectCount; i++) {
              SVGInjectElement(img[i], options, finish);
            }
          }
        } else {
          // only one img element
          SVGInjectElement(img, options, allFinish);
        }
      };

      // return a Promise object if globally available
      return typeof Promise == _UNDEFINED_ ? run() : new Promise(run);
    }


    // Injects a single svg element. Options must be already merged with the default options.
    function SVGInjectElement(imgElem, options, callback) {
      if (imgElem) {
        var svgInjectAttributeValue = imgElem[__SVGINJECT];
        if (!svgInjectAttributeValue) {
          removeEventListeners(imgElem);

          if (!IS_SVG_SUPPORTED) {
            svgNotSupported(imgElem, options);
            callback();
            return;
          }
          // Invoke beforeLoad hook if set. If the beforeLoad returns a value use it as the src for the load
          // URL path. Else use the imgElem's src attribute value.
          var beforeLoad = options.beforeLoad;
          var src = (beforeLoad && beforeLoad(imgElem)) || imgElem[_GET_ATTRIBUTE_]('src');

          if (!src) {
            // If no image src attribute is set do no injection. This can only be reached by using javascript
            // because if no src attribute is set the onload and onerror events do not get called
            if (src === '') {
              loadFail(imgElem, options);
            }
            callback();
            return;
          }

          // set array so later calls can register callbacks
          var onFinishCallbacks = [];
          imgElem[__SVGINJECT] = onFinishCallbacks;

          var onFinish = function() {
            callback();
            onFinishCallbacks.forEach(function(onFinishCallback) {
              onFinishCallback();
            });
          };

          var absUrl = getAbsoluteUrl(src);
          var useCacheOption = options.useCache;
          var makeIdsUniqueOption = options.makeIdsUnique;
          
          var setSvgLoadCacheValue = function(val) {
            if (useCacheOption) {
              svgLoadCache[absUrl].forEach(function(svgLoad) {
                svgLoad(val);
              });
              svgLoadCache[absUrl] = val;
            }
          };

          if (useCacheOption) {
            var svgLoad = svgLoadCache[absUrl];

            var handleLoadValue = function(loadValue) {
              if (loadValue === LOAD_FAIL) {
                loadFail(imgElem, options);
              } else if (loadValue === SVG_INVALID) {
                svgInvalid(imgElem, options);
              } else {
                var hasUniqueIds = loadValue[0];
                var svgString = loadValue[1];
                var uniqueIdsSvgString = loadValue[2];
                var svgElem;

                if (makeIdsUniqueOption) {
                  if (hasUniqueIds === NULL) {
                    // IDs for the SVG string have not been made unique before. This may happen if previous
                    // injection of a cached SVG have been run with the option makedIdsUnique set to false
                    svgElem = buildSvgElement(svgString, false);
                    hasUniqueIds = makeIdsUnique(svgElem, false);

                    loadValue[0] = hasUniqueIds;
                    loadValue[2] = hasUniqueIds && svgElemToSvgString(svgElem);
                  } else if (hasUniqueIds) {
                    // Make IDs unique for already cached SVGs with better performance
                    svgString = makeIdsUniqueCached(uniqueIdsSvgString);
                  }
                }

                svgElem = svgElem || buildSvgElement(svgString, false);

                inject(imgElem, svgElem, absUrl, options);
              }
              onFinish();
            };

            if (typeof svgLoad != _UNDEFINED_) {
              // Value for url exists in cache
              if (svgLoad.isCallbackQueue) {
                // Same url has been cached, but value has not been loaded yet, so add to callbacks
                svgLoad.push(handleLoadValue);
              } else {
                handleLoadValue(svgLoad);
              }
              return;
            } else {
              var svgLoad = [];
              // set property isCallbackQueue to Array to differentiate from array with cached loaded values
              svgLoad.isCallbackQueue = true;
              svgLoadCache[absUrl] = svgLoad;
            }
          }

          // Load the SVG because it is not cached or caching is disabled
          loadSvg(absUrl, function(svgXml, svgString) {
            // Use the XML from the XHR request if it is an instance of Document. Otherwise
            // (for example of IE9), create the svg document from the svg string.
            var svgElem = svgXml instanceof Document ? svgXml.documentElement : buildSvgElement(svgString, true);

            var afterLoad = options.afterLoad;
            if (afterLoad) {
              // Invoke afterLoad hook which may modify the SVG element. After load may also return a new
              // svg element or svg string
              var svgElemOrSvgString = afterLoad(svgElem, svgString) || svgElem;
              if (svgElemOrSvgString) {
                // Update svgElem and svgString because of modifications to the SVG element or SVG string in
                // the afterLoad hook, so the modified SVG is also used for all later cached injections
                var isString = typeof svgElemOrSvgString == 'string';
                svgString = isString ? svgElemOrSvgString : svgElemToSvgString(svgElem);
                svgElem = isString ? buildSvgElement(svgElemOrSvgString, true) : svgElemOrSvgString;
              }
            }

            if (svgElem instanceof SVGElement) {
              var hasUniqueIds = NULL;
              if (makeIdsUniqueOption) {
                hasUniqueIds = makeIdsUnique(svgElem, false);
              }

              if (useCacheOption) {
                var uniqueIdsSvgString = hasUniqueIds && svgElemToSvgString(svgElem);
                // set an array with three entries to the load cache
                setSvgLoadCacheValue([hasUniqueIds, svgString, uniqueIdsSvgString]);
              }

              inject(imgElem, svgElem, absUrl, options);
            } else {
              svgInvalid(imgElem, options);
              setSvgLoadCacheValue(SVG_INVALID);
            }
            onFinish();
          }, function() {
            loadFail(imgElem, options);
            setSvgLoadCacheValue(LOAD_FAIL);
            onFinish();
          });
        } else {
          if (Array.isArray(svgInjectAttributeValue)) {
            // svgInjectAttributeValue is an array. Injection is not complete so register callback
            svgInjectAttributeValue.push(callback);
          } else {
            callback();
          }
        }
      } else {
        imgNotSet();
      }
    }


    /**
     * Sets the default [options](#options) for SVGInject.
     *
     * @param {Object} [options] - default [options](#options) for an injection.
     */
    SVGInject.setOptions = function(options) {
      defaultOptions = mergeOptions(defaultOptions, options);
    };


    // Create a new instance of SVGInject
    SVGInject.create = createSVGInject;


    /**
     * Used in onerror Event of an `<img>` element to handle cases when the loading the original src fails
     * (for example if file is not found or if the browser does not support SVG). This triggers a call to the
     * options onFail hook if available. The optional second parameter will be set as the new src attribute
     * for the img element.
     *
     * @param {HTMLImageElement} img - an img element
     * @param {String} [fallbackSrc] - optional parameter fallback src
     */
    SVGInject.err = function(img, fallbackSrc) {
      if (img) {
        if (img[__SVGINJECT] != FAIL) {
          removeEventListeners(img);

          if (!IS_SVG_SUPPORTED) {
            svgNotSupported(img, defaultOptions);
          } else {
            removeOnLoadAttribute(img);
            loadFail(img, defaultOptions);
          }
          if (fallbackSrc) {
            removeOnLoadAttribute(img);
            img.src = fallbackSrc;
          }
        }
      } else {
        imgNotSet();
      }
    };

    window[globalName] = SVGInject;

    return SVGInject;
  }

  var SVGInjectInstance = createSVGInject('SVGInject');

  if ( true && typeof module.exports == 'object') {
    module.exports = SVGInjectInstance;
  }
})(window, document);

/***/ }),

/***/ "./src/components/form/form.config.js":
/*!********************************************!*\
  !*** ./src/components/form/form.config.js ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   formButtons: () => (/* binding */ formButtons),
/* harmony export */   inputs: () => (/* binding */ inputs)
/* harmony export */ });
/* harmony import */ var _assets_icons_visibility_on_svg__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../assets/icons/visibility_on.svg */ "./src/assets/icons/visibility_on.svg");

const inputs = {
  email: {
    element: 'input',
    textContent: 'email',
    attributes: {
      id: 'email',
      class: 'form_input',
      name: 'email',
      type: 'email',
      placeholder: 'email@address.com',
      required: true
    },
    error: 'Enter a valid email address (e.g., your_email@xyz.com).'
  },
  country: {
    element: 'select',
    textContent: 'country',
    attributes: {
      id: 'country',
      class: 'form_input',
      name: 'country',
      required: true
    },
    children: {
      element: 'option',
      countries: [{
        '': ' '
      }, {
        ch: 'Switzerland'
      }, {
        gb: 'United Kingdom'
      }, {
        us: 'United States'
      }, {
        ca: 'Canada'
      }]
    },
    error: 'Select a country.'
  },
  zipcode: {
    element: 'input',
    textContent: 'zip code',
    attributes: {
      id: 'zipcode',
      class: 'form_input',
      name: 'zipcode',
      type: 'text',
      required: true
    }
    // error: 'Select a country and enter a valid zip code corresponding to the selected country.',
  },

  password: {
    element: 'input',
    textContent: 'password',
    attributes: {
      id: 'password',
      class: 'form_input',
      name: 'password',
      type: 'password',
      placeholder: 'Enter password',
      required: true,
      pattern: '(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*\\W)(?!.* ).{8,30}'
    },
    sibling: {
      element: 'button',
      attributes: {
        class: 'btn_visibility',
        type: 'button'
      },
      child: {
        element: 'img',
        attributes: {
          class: 'visibility',
          src: _assets_icons_visibility_on_svg__WEBPACK_IMPORTED_MODULE_0__,
          onload: 'SVGInject(this)'
        }
      }
    },
    error: 'Password must be at least 8 characters long, can be up to 30 characters long, and must contain 1 of each of the following: uppercase letter, lowercase letter, number, and special character; no spaces allowed.'
  },
  passwordConfirmation: {
    element: 'input',
    textContent: 'confirm password',
    attributes: {
      id: 'password_confirm',
      class: 'form_input',
      name: 'password_confirm',
      type: 'password',
      placeholder: 'Reenter password',
      required: true
    },
    sibling: {
      element: 'button',
      attributes: {
        class: 'btn_visibility',
        type: 'button'
      },
      child: {
        element: 'img',
        attributes: {
          class: 'visibility',
          src: _assets_icons_visibility_on_svg__WEBPACK_IMPORTED_MODULE_0__,
          onload: 'SVGInject(this)'
        }
      }
    },
    error: 'Passwords do not match.'
  }
};
const formButtons = {
  cancel: {
    element: 'button',
    attributes: {
      class: 'btn_cancel',
      type: 'button'
    }
  },
  submit: {
    element: 'button',
    attributes: {
      class: 'btn_submit',
      type: 'submit'
    }
  }
};

/***/ }),

/***/ "./src/components/form/form.js":
/*!*************************************!*\
  !*** ./src/components/form/form.js ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _form_config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./form.config */ "./src/components/form/form.config.js");
/* harmony import */ var _utilities_createElement__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utilities/createElement */ "./src/utilities/createElement.js");
/* harmony import */ var _form_css__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./form.css */ "./src/components/form/form.css");
/* harmony import */ var _assets_icons_visibility_on_svg__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../assets/icons/visibility_on.svg */ "./src/assets/icons/visibility_on.svg");
/* harmony import */ var _assets_icons_visibility_off_svg__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../assets/icons/visibility_off.svg */ "./src/assets/icons/visibility_off.svg");





/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (state => ({
  type: state.type,
  cacheDOM(container) {
    this.form = container;
    this.inputs = container.querySelectorAll('.form_item input, .form_item select');
    this.btnCancel = container.querySelector('.btn_cancel');
    this.validityErrors = container.querySelectorAll('.validity_error');
    this.btnSubmit = container.querySelector('.btn_submit');
    this.btnsVisibility = container.querySelectorAll('.btn_visibility');
  },
  bindEvents() {
    this.submitForm = this.submitForm.bind(this);
    this.resetForm = this.resetForm.bind(this);
    this.togglePassword = this.togglePassword.bind(this);
    this.form.addEventListener('submit', this.submitForm);
    this.btnCancel.addEventListener('click', this.resetForm);
    this.btnsVisibility.forEach(btn => btn.addEventListener('click', this.togglePassword));

    // in form_validation_controller.js
    this.validateInput = this.validateInput.bind(this);
    this.inputs.forEach(input => this.bindInput(input, 'blur'));
  },
  bindInput(input, eventType) {
    input.addEventListener(eventType, this.validateInput);
  },
  render() {
    const formElement = (0,_utilities_createElement__WEBPACK_IMPORTED_MODULE_1__["default"])('form');
    const container = document.createElement('div');
    formElement.setAttributes({
      id: 'form',
      novalidate: true
    });
    container.classList.add('container');
    Object.keys(_form_config__WEBPACK_IMPORTED_MODULE_0__.inputs).forEach(input => {
      const formItem = (0,_utilities_createElement__WEBPACK_IMPORTED_MODULE_1__["default"])('div');
      const formLabel = (0,_utilities_createElement__WEBPACK_IMPORTED_MODULE_1__["default"])('label');
      const formError = (0,_utilities_createElement__WEBPACK_IMPORTED_MODULE_1__["default"])('span');
      const inputWrapper = (0,_utilities_createElement__WEBPACK_IMPORTED_MODULE_1__["default"])('div');
      const formInput = (0,_utilities_createElement__WEBPACK_IMPORTED_MODULE_1__["default"])(_form_config__WEBPACK_IMPORTED_MODULE_0__.inputs[input].element);
      formItem.setAttributes({
        class: 'form_item'
      });
      formInput.setAttributes(_form_config__WEBPACK_IMPORTED_MODULE_0__.inputs[input].attributes);
      inputWrapper.setAttributes({
        class: 'input_wrapper'
      });
      formLabel.setAttributes({
        for: _form_config__WEBPACK_IMPORTED_MODULE_0__.inputs[input].attributes.id
      });
      formLabel.textContent = _form_config__WEBPACK_IMPORTED_MODULE_0__.inputs[input].textContent;
      formError.setAttributes({
        class: `validity_error ${_form_config__WEBPACK_IMPORTED_MODULE_0__.inputs[input].attributes.id}`,
        'aria-live': 'polite'
      });
      formError.textContent = _form_config__WEBPACK_IMPORTED_MODULE_0__.inputs[input].error;
      inputWrapper.appendChild(formInput);
      if (_form_config__WEBPACK_IMPORTED_MODULE_0__.inputs[input].children) {
        // need to set option value AND textContent
        // for example, value='ch' and textContent will be Switzerland
        const {
          children: options
        } = _form_config__WEBPACK_IMPORTED_MODULE_0__.inputs[input];
        for (let i = 0; i < options.countries.length; i += 1) {
          const option = (0,_utilities_createElement__WEBPACK_IMPORTED_MODULE_1__["default"])(options.element);
          Object.entries(options.countries[i]).forEach(_ref => {
            let [key, value] = _ref;
            option.value = key;
            option.textContent = value;
          });
          formInput.appendChild(option);
        }
      } else if (_form_config__WEBPACK_IMPORTED_MODULE_0__.inputs[input].sibling) {
        const btnVisibility = (0,_utilities_createElement__WEBPACK_IMPORTED_MODULE_1__["default"])(_form_config__WEBPACK_IMPORTED_MODULE_0__.inputs[input].sibling.element);
        const visibilityIcon = (0,_utilities_createElement__WEBPACK_IMPORTED_MODULE_1__["default"])(_form_config__WEBPACK_IMPORTED_MODULE_0__.inputs[input].sibling.child.element);
        btnVisibility.setAttributes(_form_config__WEBPACK_IMPORTED_MODULE_0__.inputs[input].sibling.attributes);
        visibilityIcon.setAttributes(_form_config__WEBPACK_IMPORTED_MODULE_0__.inputs[input].sibling.child.attributes);
        btnVisibility.appendChild(visibilityIcon);
        inputWrapper.appendChild(btnVisibility);
      }
      formItem.appendChild(formLabel);
      formItem.appendChild(inputWrapper);
      formItem.appendChild(formError);
      container.appendChild(formItem);
    });
    const formButtonsContainer = (0,_utilities_createElement__WEBPACK_IMPORTED_MODULE_1__["default"])('div');
    formButtonsContainer.setAttributes({
      class: 'form_buttons'
    });
    Object.keys(_form_config__WEBPACK_IMPORTED_MODULE_0__.formButtons).forEach(btn => {
      const formButton = (0,_utilities_createElement__WEBPACK_IMPORTED_MODULE_1__["default"])(_form_config__WEBPACK_IMPORTED_MODULE_0__.formButtons[btn].element);
      formButton.setAttributes(_form_config__WEBPACK_IMPORTED_MODULE_0__.formButtons[btn].attributes);
      formButton.textContent = btn;
      formButtonsContainer.appendChild(formButton);
    });
    container.appendChild(formButtonsContainer);
    formElement.appendChild(container);
    this.cacheDOM(formElement);
    this.bindEvents();
    return formElement;
  },
  togglePassword(e) {
    const input = e.currentTarget.previousSibling;
    const icon = e.currentTarget.firstChild;
    const newIcon = (0,_utilities_createElement__WEBPACK_IMPORTED_MODULE_1__["default"])('img');
    newIcon.setAttributes({
      class: icon.classList,
      src: icon.dataset.injectUrl === _assets_icons_visibility_on_svg__WEBPACK_IMPORTED_MODULE_3__ ? _assets_icons_visibility_off_svg__WEBPACK_IMPORTED_MODULE_4__ : _assets_icons_visibility_on_svg__WEBPACK_IMPORTED_MODULE_3__,
      onload: 'SVGInject(this)'
    });
    input.type !== 'text' ? input.type = 'text' : input.type = 'password';
    icon.replaceWith(newIcon);
  }
}));

/***/ }),

/***/ "./src/components/form/form_validation_controller.js":
/*!***********************************************************!*\
  !*** ./src/components/form/form_validation_controller.js ***!
  \***********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _zipcodes__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./zipcodes */ "./src/components/form/zipcodes.js");

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (() => ({
  resetForm() {
    this.inputs.forEach(input => {
      input.value = '';
      input.classList.remove('input_error');
    });
    this.validityErrors.forEach(error => {
      error.style.display = 'none';
    });
  },
  submitForm(e) {
    e.preventDefault();
    this.inputs.forEach(input => this.validateInput(input));
    if ([...this.inputs].every(input => this.validateInput(input))) {
      this.resetForm();
    }
  },
  validateInput(e) {
    console.log(e);
    const input = e.currentTarget ? e.currentTarget : e;
    const error = [...this.validityErrors].find(validityError => validityError.classList.contains(input.id));
    if (input.id === 'password_confirm') {
      input.pattern = [...this.inputs].find(key => key.type === input.type).value;
    } else if (input.id === 'zipcode') {
      const inputCountry = [...this.inputs].find(key => key.id === 'country');
      const zipCountry = Object.values(_zipcodes__WEBPACK_IMPORTED_MODULE_0__["default"]).find(country => country.iso === inputCountry.value);
      if (zipCountry) {
        input.pattern = zipCountry.regex;
        error.textContent = zipCountry.error;
      }
    }
    const validity = input.checkValidity();
    const {
      type
    } = e;
    if (!validity) {
      if (type === 'blur' && !input.classList.contains('input_error')) {
        // validity check is aggressive
        console.log('validity is false AND type is blur');
        this.bindInput(input, 'input');
      } else if (type === 'input') {
        console.log('validity is false AND type is input');
      } else {
        console.log('validity is false and else running');
      }
      // error.style.visibility = 'visible';
      error.style.display = 'block';
      input.classList.add('input_error');
    } else {
      // error.style.visibility = 'hidden';
      error.style.display = 'none';
      input.classList.remove('input_error');
      input.removeEventListener('input', this.validateInput);
    }
    return validity;
  }
}));

/***/ }),

/***/ "./src/components/form/init_form.js":
/*!******************************************!*\
  !*** ./src/components/form/init_form.js ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _form__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./form */ "./src/components/form/form.js");
/* harmony import */ var _form_validation_controller__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./form_validation_controller */ "./src/components/form/form_validation_controller.js");


const initForm = type => {
  const state = {
    type
  };
  return {
    ...(0,_form__WEBPACK_IMPORTED_MODULE_0__["default"])(state),
    ...(0,_form_validation_controller__WEBPACK_IMPORTED_MODULE_1__["default"])(state)
  };
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  sections: [],
  add(type) {
    this.sections = [...this.sections, initForm(type)];
    return this.find(type);
  },
  remove(type) {
    this.sections.splice(this.sections.indexOf(this.find(type)), 1);
  },
  find(type) {
    return this.sections.find(section => section.type === type);
  }
});

/***/ }),

/***/ "./src/components/form/zipcodes.js":
/*!*****************************************!*\
  !*** ./src/components/form/zipcodes.js ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ([{
  // fallback error message when no country is selected
  iso: '',
  regex: '',
  error: 'Select a country and enter a valid zip code corresponding to the selected country.'
}, {
  country: 'swizterland',
  iso: 'ch',
  regex: '(CH-)?\\d{4}',
  error: 'Switzerland zip codes must be between 4-7 characters long (e.g., "CH-1950" or "1950").'
}, {
  country: 'united kingdom',
  iso: 'gb',
  regex: '[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}',
  error: 'United Kingdom zip codes must be between 6-8 characters long (e.g., "SW1W 0NY" or "L1 8JQ").'
}, {
  country: 'united states',
  iso: 'us',
  regex: '\\b(\\d){5}(([ \\-])?\\d{4})?',
  error: 'United States zip codes must be between 5-10 characters long made up with only digits and a single space/hyphen (e.g., "12345" or "12345-6789").'
}, {
  country: 'canada',
  iso: 'ca',
  regex: '([A-Z]\\d[A-Z]) (\\d[A-Z]\\d)',
  error: 'Canada zip codes must be 7 characters long (e.g., "C0A 1A0").'
}]);

/***/ }),

/***/ "./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _index_css__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./index.css */ "./src/index.css");
/* harmony import */ var _components_form_init_form__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./components/form/init_form */ "./src/components/form/init_form.js");
/* harmony import */ var _iconfu_svg_inject__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @iconfu/svg-inject */ "./node_modules/@iconfu/svg-inject/dist/svg-inject.js");
/* harmony import */ var _iconfu_svg_inject__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_iconfu_svg_inject__WEBPACK_IMPORTED_MODULE_2__);
// Delete or rename as needed




// const staticForm = buildForm.add('static');
// document.body.appendChild(staticForm.render());
document.body.appendChild(_components_form_init_form__WEBPACK_IMPORTED_MODULE_1__["default"].add('static').render());

/***/ }),

/***/ "./src/utilities/createElement.js":
/*!****************************************!*\
  !*** ./src/utilities/createElement.js ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ createElement)
/* harmony export */ });
// creates an element
// return element with setAttributes method
const setElementState = () => ({
  setAttributes(attributes) {
    Object.entries(attributes).forEach(_ref => {
      let [key, value] = _ref;
      this.setAttribute(key, value);
    });
  }
});
const BuildElement = element => {
  const state = {
    element
  };
  return {
    ...setElementState(state)
  };
};
function createElement(element) {
  const htmlElement = document.createElement(element);
  Object.assign(htmlElement, BuildElement(htmlElement));
  return htmlElement;
}

/***/ }),

/***/ "./node_modules/css-loader/dist/cjs.js!./src/components/form/form.css":
/*!****************************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js!./src/components/form/form.css ***!
  \****************************************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../node_modules/css-loader/dist/runtime/sourceMaps.js */ "./node_modules/css-loader/dist/runtime/sourceMaps.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../node_modules/css-loader/dist/runtime/api.js */ "./node_modules/css-loader/dist/runtime/api.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default()));
// Module
___CSS_LOADER_EXPORT___.push([module.id, `#form {
  width: 500px;
  margin: auto;
}

#form > .container {
  display: flex;
  flex-direction: column;
  row-gap: 1rem;
  padding: 1rem;
}

#form > .container > .form_item {
  display: flex;
  flex-direction: column;
  row-gap: 0.25rem;
}

#form > .container > .form_item > label::first-letter {
  text-transform: uppercase;
}

#form > .container > .form_item > .input_wrapper {
  display: flex;
}

#form > .container > .form_item > .input_wrapper > .form_input {
  flex: 1 auto;
  padding: 0.5rem;
  border-radius: 0.25rem;
  border: none;
}

#form > .container > .form_item > .input_wrapper > .form_input:valid {
  border: 2px solid green;
}

#form > .container > .form_item > .input_wrapper > .form_input:focus {
  border-color: black;
  border-width: 6px;
  padding: 0.75rem;
  outline: none;
}

#form > .container > .form_item > label[for='password'] + .input_wrapper,
#form > .container > .form_item > label[for='password_confirm'] + .input_wrapper {
  display: flex;
  position: relative;
}

#form > .container > .form_item > label[for='password'] + .input_wrapper > .btn_visibility,
#form > .container > .form_item > label[for='password_confirm'] + .input_wrapper > .btn_visibility {
  background: transparent;
  border: none;
  position: absolute;
  right: 12px;
  align-self: center;
  display: flex;
}

#form > .container > .form_item > label[for='password'] + .input_wrapper > .btn_visibility:hover,
#form
  > .container
  > .form_item
  > label[for='password_confirm']
  + .input_wrapper
  > .btn_visibility:hover {
  cursor: pointer;
}

#form > .container > .form_item > .input_wrapper > .input_error {
  border: 3px solid rgb(255, 0, 0);
}

#form > .container > .form_item > .validity_error {
  display: none;
  color: rgb(255, 0, 0);
}

#form > .container > .form_buttons {
  display: flex;
  justify-content: end;
  column-gap: 0.5rem;
}

#form > .container > .form_buttons > button {
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  border: none;
  box-shadow: 0 2px 3px -2px black;
  text-transform: capitalize;
}

#form > .container > .form_buttons > button:hover {
  cursor: pointer;
}

#form > .container > .form_buttons > button:active {
  box-shadow: 0 5px 5px -2px black;
}
`, "",{"version":3,"sources":["webpack://./src/components/form/form.css"],"names":[],"mappings":"AAAA;EACE,YAAY;EACZ,YAAY;AACd;;AAEA;EACE,aAAa;EACb,sBAAsB;EACtB,aAAa;EACb,aAAa;AACf;;AAEA;EACE,aAAa;EACb,sBAAsB;EACtB,gBAAgB;AAClB;;AAEA;EACE,yBAAyB;AAC3B;;AAEA;EACE,aAAa;AACf;;AAEA;EACE,YAAY;EACZ,eAAe;EACf,sBAAsB;EACtB,YAAY;AACd;;AAEA;EACE,uBAAuB;AACzB;;AAEA;EACE,mBAAmB;EACnB,iBAAiB;EACjB,gBAAgB;EAChB,aAAa;AACf;;AAEA;;EAEE,aAAa;EACb,kBAAkB;AACpB;;AAEA;;EAEE,uBAAuB;EACvB,YAAY;EACZ,kBAAkB;EAClB,WAAW;EACX,kBAAkB;EAClB,aAAa;AACf;;AAEA;;;;;;;EAOE,eAAe;AACjB;;AAEA;EACE,gCAAgC;AAClC;;AAEA;EACE,aAAa;EACb,qBAAqB;AACvB;;AAEA;EACE,aAAa;EACb,oBAAoB;EACpB,kBAAkB;AACpB;;AAEA;EACE,oBAAoB;EACpB,sBAAsB;EACtB,YAAY;EACZ,gCAAgC;EAChC,0BAA0B;AAC5B;;AAEA;EACE,eAAe;AACjB;;AAEA;EACE,gCAAgC;AAClC","sourcesContent":["#form {\n  width: 500px;\n  margin: auto;\n}\n\n#form > .container {\n  display: flex;\n  flex-direction: column;\n  row-gap: 1rem;\n  padding: 1rem;\n}\n\n#form > .container > .form_item {\n  display: flex;\n  flex-direction: column;\n  row-gap: 0.25rem;\n}\n\n#form > .container > .form_item > label::first-letter {\n  text-transform: uppercase;\n}\n\n#form > .container > .form_item > .input_wrapper {\n  display: flex;\n}\n\n#form > .container > .form_item > .input_wrapper > .form_input {\n  flex: 1 auto;\n  padding: 0.5rem;\n  border-radius: 0.25rem;\n  border: none;\n}\n\n#form > .container > .form_item > .input_wrapper > .form_input:valid {\n  border: 2px solid green;\n}\n\n#form > .container > .form_item > .input_wrapper > .form_input:focus {\n  border-color: black;\n  border-width: 6px;\n  padding: 0.75rem;\n  outline: none;\n}\n\n#form > .container > .form_item > label[for='password'] + .input_wrapper,\n#form > .container > .form_item > label[for='password_confirm'] + .input_wrapper {\n  display: flex;\n  position: relative;\n}\n\n#form > .container > .form_item > label[for='password'] + .input_wrapper > .btn_visibility,\n#form > .container > .form_item > label[for='password_confirm'] + .input_wrapper > .btn_visibility {\n  background: transparent;\n  border: none;\n  position: absolute;\n  right: 12px;\n  align-self: center;\n  display: flex;\n}\n\n#form > .container > .form_item > label[for='password'] + .input_wrapper > .btn_visibility:hover,\n#form\n  > .container\n  > .form_item\n  > label[for='password_confirm']\n  + .input_wrapper\n  > .btn_visibility:hover {\n  cursor: pointer;\n}\n\n#form > .container > .form_item > .input_wrapper > .input_error {\n  border: 3px solid rgb(255, 0, 0);\n}\n\n#form > .container > .form_item > .validity_error {\n  display: none;\n  color: rgb(255, 0, 0);\n}\n\n#form > .container > .form_buttons {\n  display: flex;\n  justify-content: end;\n  column-gap: 0.5rem;\n}\n\n#form > .container > .form_buttons > button {\n  padding: 0.5rem 1rem;\n  border-radius: 0.25rem;\n  border: none;\n  box-shadow: 0 2px 3px -2px black;\n  text-transform: capitalize;\n}\n\n#form > .container > .form_buttons > button:hover {\n  cursor: pointer;\n}\n\n#form > .container > .form_buttons > button:active {\n  box-shadow: 0 5px 5px -2px black;\n}\n"],"sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ "./node_modules/css-loader/dist/cjs.js!./src/index.css":
/*!*************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js!./src/index.css ***!
  \*************************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../node_modules/css-loader/dist/runtime/sourceMaps.js */ "./node_modules/css-loader/dist/runtime/sourceMaps.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../node_modules/css-loader/dist/runtime/api.js */ "./node_modules/css-loader/dist/runtime/api.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../node_modules/css-loader/dist/runtime/getUrl.js */ "./node_modules/css-loader/dist/runtime/getUrl.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2__);
// Imports



var ___CSS_LOADER_URL_IMPORT_0___ = new URL(/* asset import */ __webpack_require__(/*! ./assets/fonts/Poppins/Poppins-Regular.ttf */ "./src/assets/fonts/Poppins/Poppins-Regular.ttf"), __webpack_require__.b);
var ___CSS_LOADER_URL_IMPORT_1___ = new URL(/* asset import */ __webpack_require__(/*! ./assets/fonts/Poppins/Poppins-SemiBold.ttf */ "./src/assets/fonts/Poppins/Poppins-SemiBold.ttf"), __webpack_require__.b);
var ___CSS_LOADER_URL_IMPORT_2___ = new URL(/* asset import */ __webpack_require__(/*! ./assets/fonts/Poppins/Poppins-Thin.ttf */ "./src/assets/fonts/Poppins/Poppins-Thin.ttf"), __webpack_require__.b);
var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default()));
var ___CSS_LOADER_URL_REPLACEMENT_0___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(___CSS_LOADER_URL_IMPORT_0___);
var ___CSS_LOADER_URL_REPLACEMENT_1___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(___CSS_LOADER_URL_IMPORT_1___);
var ___CSS_LOADER_URL_REPLACEMENT_2___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(___CSS_LOADER_URL_IMPORT_2___);
// Module
___CSS_LOADER_EXPORT___.push([module.id, `/* Delete or rename as needed */
@font-face {
  font-family: 'Poppins';
  src: url(${___CSS_LOADER_URL_REPLACEMENT_0___}),
    url(${___CSS_LOADER_URL_REPLACEMENT_1___}),
    url(${___CSS_LOADER_URL_REPLACEMENT_2___});
    font-weight: normal;
    font-style: normal;
}

*, *::before, *::after {
  box-sizing: border-box;
  -webkit-box-sizing: border-box;
  -moz-box-sizing: border-box;
  padding: 0;
  margin: 0;
}

body {
  background-color: lightblue;
  font-family: 'Poppins', Arial, sans-serif;
}`, "",{"version":3,"sources":["webpack://./src/index.css"],"names":[],"mappings":"AAAA,+BAA+B;AAC/B;EACE,sBAAsB;EACtB;;2CAEgD;IAC9C,mBAAmB;IACnB,kBAAkB;AACtB;;AAEA;EACE,sBAAsB;EACtB,8BAA8B;EAC9B,2BAA2B;EAC3B,UAAU;EACV,SAAS;AACX;;AAEA;EACE,2BAA2B;EAC3B,yCAAyC;AAC3C","sourcesContent":["/* Delete or rename as needed */\n@font-face {\n  font-family: 'Poppins';\n  src: url('./assets/fonts/Poppins/Poppins-Regular.ttf'),\n    url('./assets/fonts/Poppins/Poppins-SemiBold.ttf'),\n    url('./assets/fonts/Poppins/Poppins-Thin.ttf');\n    font-weight: normal;\n    font-style: normal;\n}\n\n*, *::before, *::after {\n  box-sizing: border-box;\n  -webkit-box-sizing: border-box;\n  -moz-box-sizing: border-box;\n  padding: 0;\n  margin: 0;\n}\n\nbody {\n  background-color: lightblue;\n  font-family: 'Poppins', Arial, sans-serif;\n}"],"sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ "./node_modules/css-loader/dist/runtime/api.js":
/*!*****************************************************!*\
  !*** ./node_modules/css-loader/dist/runtime/api.js ***!
  \*****************************************************/
/***/ ((module) => {

"use strict";


/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
module.exports = function (cssWithMappingToString) {
  var list = [];

  // return the list of modules as css string
  list.toString = function toString() {
    return this.map(function (item) {
      var content = "";
      var needLayer = typeof item[5] !== "undefined";
      if (item[4]) {
        content += "@supports (".concat(item[4], ") {");
      }
      if (item[2]) {
        content += "@media ".concat(item[2], " {");
      }
      if (needLayer) {
        content += "@layer".concat(item[5].length > 0 ? " ".concat(item[5]) : "", " {");
      }
      content += cssWithMappingToString(item);
      if (needLayer) {
        content += "}";
      }
      if (item[2]) {
        content += "}";
      }
      if (item[4]) {
        content += "}";
      }
      return content;
    }).join("");
  };

  // import a list of modules into the list
  list.i = function i(modules, media, dedupe, supports, layer) {
    if (typeof modules === "string") {
      modules = [[null, modules, undefined]];
    }
    var alreadyImportedModules = {};
    if (dedupe) {
      for (var k = 0; k < this.length; k++) {
        var id = this[k][0];
        if (id != null) {
          alreadyImportedModules[id] = true;
        }
      }
    }
    for (var _k = 0; _k < modules.length; _k++) {
      var item = [].concat(modules[_k]);
      if (dedupe && alreadyImportedModules[item[0]]) {
        continue;
      }
      if (typeof layer !== "undefined") {
        if (typeof item[5] === "undefined") {
          item[5] = layer;
        } else {
          item[1] = "@layer".concat(item[5].length > 0 ? " ".concat(item[5]) : "", " {").concat(item[1], "}");
          item[5] = layer;
        }
      }
      if (media) {
        if (!item[2]) {
          item[2] = media;
        } else {
          item[1] = "@media ".concat(item[2], " {").concat(item[1], "}");
          item[2] = media;
        }
      }
      if (supports) {
        if (!item[4]) {
          item[4] = "".concat(supports);
        } else {
          item[1] = "@supports (".concat(item[4], ") {").concat(item[1], "}");
          item[4] = supports;
        }
      }
      list.push(item);
    }
  };
  return list;
};

/***/ }),

/***/ "./node_modules/css-loader/dist/runtime/getUrl.js":
/*!********************************************************!*\
  !*** ./node_modules/css-loader/dist/runtime/getUrl.js ***!
  \********************************************************/
/***/ ((module) => {

"use strict";


module.exports = function (url, options) {
  if (!options) {
    options = {};
  }
  if (!url) {
    return url;
  }
  url = String(url.__esModule ? url.default : url);

  // If url is already wrapped in quotes, remove them
  if (/^['"].*['"]$/.test(url)) {
    url = url.slice(1, -1);
  }
  if (options.hash) {
    url += options.hash;
  }

  // Should url be wrapped?
  // See https://drafts.csswg.org/css-values-3/#urls
  if (/["'() \t\n]|(%20)/.test(url) || options.needQuotes) {
    return "\"".concat(url.replace(/"/g, '\\"').replace(/\n/g, "\\n"), "\"");
  }
  return url;
};

/***/ }),

/***/ "./node_modules/css-loader/dist/runtime/sourceMaps.js":
/*!************************************************************!*\
  !*** ./node_modules/css-loader/dist/runtime/sourceMaps.js ***!
  \************************************************************/
/***/ ((module) => {

"use strict";


module.exports = function (item) {
  var content = item[1];
  var cssMapping = item[3];
  if (!cssMapping) {
    return content;
  }
  if (typeof btoa === "function") {
    var base64 = btoa(unescape(encodeURIComponent(JSON.stringify(cssMapping))));
    var data = "sourceMappingURL=data:application/json;charset=utf-8;base64,".concat(base64);
    var sourceMapping = "/*# ".concat(data, " */");
    return [content].concat([sourceMapping]).join("\n");
  }
  return [content].join("\n");
};

/***/ }),

/***/ "./src/components/form/form.css":
/*!**************************************!*\
  !*** ./src/components/form/form.css ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !../../../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !../../../node_modules/style-loader/dist/runtime/styleDomAPI.js */ "./node_modules/style-loader/dist/runtime/styleDomAPI.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! !../../../node_modules/style-loader/dist/runtime/insertBySelector.js */ "./node_modules/style-loader/dist/runtime/insertBySelector.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! !../../../node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js */ "./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! !../../../node_modules/style-loader/dist/runtime/insertStyleElement.js */ "./node_modules/style-loader/dist/runtime/insertStyleElement.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! !../../../node_modules/style-loader/dist/runtime/styleTagTransform.js */ "./node_modules/style-loader/dist/runtime/styleTagTransform.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_form_css__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! !!../../../node_modules/css-loader/dist/cjs.js!./form.css */ "./node_modules/css-loader/dist/cjs.js!./src/components/form/form.css");

      
      
      
      
      
      
      
      
      

var options = {};

options.styleTagTransform = (_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default());
options.setAttributes = (_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default());

      options.insert = _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default().bind(null, "head");
    
options.domAPI = (_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default());
options.insertStyleElement = (_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default());

var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_form_css__WEBPACK_IMPORTED_MODULE_6__["default"], options);




       /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_form_css__WEBPACK_IMPORTED_MODULE_6__["default"] && _node_modules_css_loader_dist_cjs_js_form_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals ? _node_modules_css_loader_dist_cjs_js_form_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals : undefined);


/***/ }),

/***/ "./src/index.css":
/*!***********************!*\
  !*** ./src/index.css ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/styleDomAPI.js */ "./node_modules/style-loader/dist/runtime/styleDomAPI.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/insertBySelector.js */ "./node_modules/style-loader/dist/runtime/insertBySelector.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js */ "./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/insertStyleElement.js */ "./node_modules/style-loader/dist/runtime/insertStyleElement.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/styleTagTransform.js */ "./node_modules/style-loader/dist/runtime/styleTagTransform.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_index_css__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! !!../node_modules/css-loader/dist/cjs.js!./index.css */ "./node_modules/css-loader/dist/cjs.js!./src/index.css");

      
      
      
      
      
      
      
      
      

var options = {};

options.styleTagTransform = (_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default());
options.setAttributes = (_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default());

      options.insert = _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default().bind(null, "head");
    
options.domAPI = (_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default());
options.insertStyleElement = (_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default());

var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_index_css__WEBPACK_IMPORTED_MODULE_6__["default"], options);




       /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_index_css__WEBPACK_IMPORTED_MODULE_6__["default"] && _node_modules_css_loader_dist_cjs_js_index_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals ? _node_modules_css_loader_dist_cjs_js_index_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals : undefined);


/***/ }),

/***/ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js":
/*!****************************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js ***!
  \****************************************************************************/
/***/ ((module) => {

"use strict";


var stylesInDOM = [];
function getIndexByIdentifier(identifier) {
  var result = -1;
  for (var i = 0; i < stylesInDOM.length; i++) {
    if (stylesInDOM[i].identifier === identifier) {
      result = i;
      break;
    }
  }
  return result;
}
function modulesToDom(list, options) {
  var idCountMap = {};
  var identifiers = [];
  for (var i = 0; i < list.length; i++) {
    var item = list[i];
    var id = options.base ? item[0] + options.base : item[0];
    var count = idCountMap[id] || 0;
    var identifier = "".concat(id, " ").concat(count);
    idCountMap[id] = count + 1;
    var indexByIdentifier = getIndexByIdentifier(identifier);
    var obj = {
      css: item[1],
      media: item[2],
      sourceMap: item[3],
      supports: item[4],
      layer: item[5]
    };
    if (indexByIdentifier !== -1) {
      stylesInDOM[indexByIdentifier].references++;
      stylesInDOM[indexByIdentifier].updater(obj);
    } else {
      var updater = addElementStyle(obj, options);
      options.byIndex = i;
      stylesInDOM.splice(i, 0, {
        identifier: identifier,
        updater: updater,
        references: 1
      });
    }
    identifiers.push(identifier);
  }
  return identifiers;
}
function addElementStyle(obj, options) {
  var api = options.domAPI(options);
  api.update(obj);
  var updater = function updater(newObj) {
    if (newObj) {
      if (newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap && newObj.supports === obj.supports && newObj.layer === obj.layer) {
        return;
      }
      api.update(obj = newObj);
    } else {
      api.remove();
    }
  };
  return updater;
}
module.exports = function (list, options) {
  options = options || {};
  list = list || [];
  var lastIdentifiers = modulesToDom(list, options);
  return function update(newList) {
    newList = newList || [];
    for (var i = 0; i < lastIdentifiers.length; i++) {
      var identifier = lastIdentifiers[i];
      var index = getIndexByIdentifier(identifier);
      stylesInDOM[index].references--;
    }
    var newLastIdentifiers = modulesToDom(newList, options);
    for (var _i = 0; _i < lastIdentifiers.length; _i++) {
      var _identifier = lastIdentifiers[_i];
      var _index = getIndexByIdentifier(_identifier);
      if (stylesInDOM[_index].references === 0) {
        stylesInDOM[_index].updater();
        stylesInDOM.splice(_index, 1);
      }
    }
    lastIdentifiers = newLastIdentifiers;
  };
};

/***/ }),

/***/ "./node_modules/style-loader/dist/runtime/insertBySelector.js":
/*!********************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/insertBySelector.js ***!
  \********************************************************************/
/***/ ((module) => {

"use strict";


var memo = {};

/* istanbul ignore next  */
function getTarget(target) {
  if (typeof memo[target] === "undefined") {
    var styleTarget = document.querySelector(target);

    // Special case to return head of iframe instead of iframe itself
    if (window.HTMLIFrameElement && styleTarget instanceof window.HTMLIFrameElement) {
      try {
        // This will throw an exception if access to iframe is blocked
        // due to cross-origin restrictions
        styleTarget = styleTarget.contentDocument.head;
      } catch (e) {
        // istanbul ignore next
        styleTarget = null;
      }
    }
    memo[target] = styleTarget;
  }
  return memo[target];
}

/* istanbul ignore next  */
function insertBySelector(insert, style) {
  var target = getTarget(insert);
  if (!target) {
    throw new Error("Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.");
  }
  target.appendChild(style);
}
module.exports = insertBySelector;

/***/ }),

/***/ "./node_modules/style-loader/dist/runtime/insertStyleElement.js":
/*!**********************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/insertStyleElement.js ***!
  \**********************************************************************/
/***/ ((module) => {

"use strict";


/* istanbul ignore next  */
function insertStyleElement(options) {
  var element = document.createElement("style");
  options.setAttributes(element, options.attributes);
  options.insert(element, options.options);
  return element;
}
module.exports = insertStyleElement;

/***/ }),

/***/ "./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js":
/*!**********************************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js ***!
  \**********************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


/* istanbul ignore next  */
function setAttributesWithoutAttributes(styleElement) {
  var nonce =  true ? __webpack_require__.nc : 0;
  if (nonce) {
    styleElement.setAttribute("nonce", nonce);
  }
}
module.exports = setAttributesWithoutAttributes;

/***/ }),

/***/ "./node_modules/style-loader/dist/runtime/styleDomAPI.js":
/*!***************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/styleDomAPI.js ***!
  \***************************************************************/
/***/ ((module) => {

"use strict";


/* istanbul ignore next  */
function apply(styleElement, options, obj) {
  var css = "";
  if (obj.supports) {
    css += "@supports (".concat(obj.supports, ") {");
  }
  if (obj.media) {
    css += "@media ".concat(obj.media, " {");
  }
  var needLayer = typeof obj.layer !== "undefined";
  if (needLayer) {
    css += "@layer".concat(obj.layer.length > 0 ? " ".concat(obj.layer) : "", " {");
  }
  css += obj.css;
  if (needLayer) {
    css += "}";
  }
  if (obj.media) {
    css += "}";
  }
  if (obj.supports) {
    css += "}";
  }
  var sourceMap = obj.sourceMap;
  if (sourceMap && typeof btoa !== "undefined") {
    css += "\n/*# sourceMappingURL=data:application/json;base64,".concat(btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))), " */");
  }

  // For old IE
  /* istanbul ignore if  */
  options.styleTagTransform(css, styleElement, options.options);
}
function removeStyleElement(styleElement) {
  // istanbul ignore if
  if (styleElement.parentNode === null) {
    return false;
  }
  styleElement.parentNode.removeChild(styleElement);
}

/* istanbul ignore next  */
function domAPI(options) {
  if (typeof document === "undefined") {
    return {
      update: function update() {},
      remove: function remove() {}
    };
  }
  var styleElement = options.insertStyleElement(options);
  return {
    update: function update(obj) {
      apply(styleElement, options, obj);
    },
    remove: function remove() {
      removeStyleElement(styleElement);
    }
  };
}
module.exports = domAPI;

/***/ }),

/***/ "./node_modules/style-loader/dist/runtime/styleTagTransform.js":
/*!*********************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/styleTagTransform.js ***!
  \*********************************************************************/
/***/ ((module) => {

"use strict";


/* istanbul ignore next  */
function styleTagTransform(css, styleElement) {
  if (styleElement.styleSheet) {
    styleElement.styleSheet.cssText = css;
  } else {
    while (styleElement.firstChild) {
      styleElement.removeChild(styleElement.firstChild);
    }
    styleElement.appendChild(document.createTextNode(css));
  }
}
module.exports = styleTagTransform;

/***/ }),

/***/ "./src/assets/fonts/Poppins/Poppins-Regular.ttf":
/*!******************************************************!*\
  !*** ./src/assets/fonts/Poppins/Poppins-Regular.ttf ***!
  \******************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
module.exports = __webpack_require__.p + "35d26b781dc5fda684cc.ttf";

/***/ }),

/***/ "./src/assets/fonts/Poppins/Poppins-SemiBold.ttf":
/*!*******************************************************!*\
  !*** ./src/assets/fonts/Poppins/Poppins-SemiBold.ttf ***!
  \*******************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
module.exports = __webpack_require__.p + "ac8d04b620e54be9b0f0.ttf";

/***/ }),

/***/ "./src/assets/fonts/Poppins/Poppins-Thin.ttf":
/*!***************************************************!*\
  !*** ./src/assets/fonts/Poppins/Poppins-Thin.ttf ***!
  \***************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
module.exports = __webpack_require__.p + "59ff6a729e30c99b478e.ttf";

/***/ }),

/***/ "./src/assets/icons/visibility_off.svg":
/*!*********************************************!*\
  !*** ./src/assets/icons/visibility_off.svg ***!
  \*********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
module.exports = __webpack_require__.p + "4b99fc62db8aee4a9157.svg";

/***/ }),

/***/ "./src/assets/icons/visibility_on.svg":
/*!********************************************!*\
  !*** ./src/assets/icons/visibility_on.svg ***!
  \********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
module.exports = __webpack_require__.p + "83b4018a1f8c5cf87f50.svg";

/***/ })

},
/******/ __webpack_require__ => { // webpackRuntimeModules
/******/ var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
/******/ var __webpack_exports__ = (__webpack_exec__("./src/index.js"));
/******/ }
]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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LE1BQU07QUFDTjtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUFHQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7QUFDQTtBQUNBOzs7QUFHQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7QUFDQTtBQUNBOzs7QUFHQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSx5REFBeUQsbUJBQW1CO0FBQzVFOzs7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGVBQWUsa0JBQWtCO0FBQ2pDLGVBQWUsUUFBUTtBQUN2QjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsWUFBWTtBQUNaO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsNEJBQTRCLGlCQUFpQjtBQUM3QztBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGVB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OztBQUViOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFFBQVE7QUFDUjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7QUNqQ2E7O0FBRWI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7QUNUYTs7QUFFYjtBQUNBO0FBQ0EsY0FBYyxLQUF3QyxHQUFHLHNCQUFpQixHQUFHLENBQUk7QUFDakY7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7QUNUYTs7QUFFYjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtEQUFrRDtBQUNsRDtBQUNBO0FBQ0EsMENBQTBDO0FBQzFDO0FBQ0E7QUFDQTtBQUNBLGlGQUFpRjtBQUNqRjtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBLHlEQUF5RDtBQUN6RDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0NBQWtDO0FBQ2xDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7QUM1RGE7O0FBRWI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9tb2R1bGVfd2VicGFja19zdGFydGVyLy4vbm9kZV9tb2R1bGVzL0BpY29uZnUvc3ZnLWluamVjdC9kaXN0L3N2Zy1pbmplY3QuanMiLCJ3ZWJwYWNrOi8vbW9kdWxlX3dlYnBhY2tfc3RhcnRlci8uL3NyYy9jb21wb25lbnRzL2Zvcm0vZm9ybS5jb25maWcuanMiLCJ3ZWJwYWNrOi8vbW9kdWxlX3dlYnBhY2tfc3RhcnRlci8uL3NyYy9jb21wb25lbnRzL2Zvcm0vZm9ybS5qcyIsIndlYnBhY2s6Ly9tb2R1bGVfd2VicGFja19zdGFydGVyLy4vc3JjL2NvbXBvbmVudHMvZm9ybS9mb3JtX3ZhbGlkYXRpb25fY29udHJvbGxlci5qcyIsIndlYnBhY2s6Ly9tb2R1bGVfd2VicGFja19zdGFydGVyLy4vc3JjL2NvbXBvbmVudHMvZm9ybS9pbml0X2Zvcm0uanMiLCJ3ZWJwYWNrOi8vbW9kdWxlX3dlYnBhY2tfc3RhcnRlci8uL3NyYy9jb21wb25lbnRzL2Zvcm0vemlwY29kZXMuanMiLCJ3ZWJwYWNrOi8vbW9kdWxlX3dlYnBhY2tfc3RhcnRlci8uL3NyYy9pbmRleC5qcyIsIndlYnBhY2s6Ly9tb2R1bGVfd2VicGFja19zdGFydGVyLy4vc3JjL3V0aWxpdGllcy9jcmVhdGVFbGVtZW50LmpzIiwid2VicGFjazovL21vZHVsZV93ZWJwYWNrX3N0YXJ0ZXIvLi9zcmMvY29tcG9uZW50cy9mb3JtL2Zvcm0uY3NzIiwid2VicGFjazovL21vZHVsZV93ZWJwYWNrX3N0YXJ0ZXIvLi9zcmMvaW5kZXguY3NzIiwid2VicGFjazovL21vZHVsZV93ZWJwYWNrX3N0YXJ0ZXIvLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9kaXN0L3J1bnRpbWUvYXBpLmpzIiwid2VicGFjazovL21vZHVsZV93ZWJwYWNrX3N0YXJ0ZXIvLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9kaXN0L3J1bnRpbWUvZ2V0VXJsLmpzIiwid2VicGFjazovL21vZHVsZV93ZWJwYWNrX3N0YXJ0ZXIvLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9kaXN0L3J1bnRpbWUvc291cmNlTWFwcy5qcyIsIndlYnBhY2s6Ly9tb2R1bGVfd2VicGFja19zdGFydGVyLy4vc3JjL2NvbXBvbmVudHMvZm9ybS9mb3JtLmNzcz9hNmVmIiwid2VicGFjazovL21vZHVsZV93ZWJwYWNrX3N0YXJ0ZXIvLi9zcmMvaW5kZXguY3NzP2NmZTQiLCJ3ZWJwYWNrOi8vbW9kdWxlX3dlYnBhY2tfc3RhcnRlci8uL25vZGVfbW9kdWxlcy9zdHlsZS1sb2FkZXIvZGlzdC9ydW50aW1lL2luamVjdFN0eWxlc0ludG9TdHlsZVRhZy5qcyIsIndlYnBhY2s6Ly9tb2R1bGVfd2VicGFja19zdGFydGVyLy4vbm9kZV9tb2R1bGVzL3N0eWxlLWxvYWRlci9kaXN0L3J1bnRpbWUvaW5zZXJ0QnlTZWxlY3Rvci5qcyIsIndlYnBhY2s6Ly9tb2R1bGVfd2VicGFja19zdGFydGVyLy4vbm9kZV9tb2R1bGVzL3N0eWxlLWxvYWRlci9kaXN0L3J1bnRpbWUvaW5zZXJ0U3R5bGVFbGVtZW50LmpzIiwid2VicGFjazovL21vZHVsZV93ZWJwYWNrX3N0YXJ0ZXIvLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2Rpc3QvcnVudGltZS9zZXRBdHRyaWJ1dGVzV2l0aG91dEF0dHJpYnV0ZXMuanMiLCJ3ZWJwYWNrOi8vbW9kdWxlX3dlYnBhY2tfc3RhcnRlci8uL25vZGVfbW9kdWxlcy9zdHlsZS1sb2FkZXIvZGlzdC9ydW50aW1lL3N0eWxlRG9tQVBJLmpzIiwid2VicGFjazovL21vZHVsZV93ZWJwYWNrX3N0YXJ0ZXIvLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2Rpc3QvcnVudGltZS9zdHlsZVRhZ1RyYW5zZm9ybS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFNWR0luamVjdCAtIFZlcnNpb24gMS4yLjNcbiAqIEEgdGlueSwgaW50dWl0aXZlLCByb2J1c3QsIGNhY2hpbmcgc29sdXRpb24gZm9yIGluamVjdGluZyBTVkcgZmlsZXMgaW5saW5lIGludG8gdGhlIERPTS5cbiAqXG4gKiBodHRwczovL2dpdGh1Yi5jb20vaWNvbmZ1L3N2Zy1pbmplY3RcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTggSU5DT1JTLCB0aGUgY3JlYXRvcnMgb2YgaWNvbmZ1LmNvbVxuICogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgLSBodHRwczovL2dpdGh1Yi5jb20vaWNvbmZ1L3N2Zy1pbmplY3QvYmxvYi9tYXN0ZXIvTElDRU5TRVxuICovXG5cbihmdW5jdGlvbih3aW5kb3csIGRvY3VtZW50KSB7XG4gIC8vIGNvbnN0YW50cyBmb3IgYmV0dGVyIG1pbmlmaWNhdGlvblxuICB2YXIgX0NSRUFURV9FTEVNRU5UXyA9ICdjcmVhdGVFbGVtZW50JztcbiAgdmFyIF9HRVRfRUxFTUVOVFNfQllfVEFHX05BTUVfID0gJ2dldEVsZW1lbnRzQnlUYWdOYW1lJztcbiAgdmFyIF9MRU5HVEhfID0gJ2xlbmd0aCc7XG4gIHZhciBfU1RZTEVfID0gJ3N0eWxlJztcbiAgdmFyIF9USVRMRV8gPSAndGl0bGUnO1xuICB2YXIgX1VOREVGSU5FRF8gPSAndW5kZWZpbmVkJztcbiAgdmFyIF9TRVRfQVRUUklCVVRFXyA9ICdzZXRBdHRyaWJ1dGUnO1xuICB2YXIgX0dFVF9BVFRSSUJVVEVfID0gJ2dldEF0dHJpYnV0ZSc7XG5cbiAgdmFyIE5VTEwgPSBudWxsO1xuXG4gIC8vIGNvbnN0YW50c1xuICB2YXIgX19TVkdJTkpFQ1QgPSAnX19zdmdJbmplY3QnO1xuICB2YXIgSURfU1VGRklYID0gJy0taW5qZWN0LSc7XG4gIHZhciBJRF9TVUZGSVhfUkVHRVggPSBuZXcgUmVnRXhwKElEX1NVRkZJWCArICdcXFxcZCsnLCBcImdcIik7XG4gIHZhciBMT0FEX0ZBSUwgPSAnTE9BRF9GQUlMJztcbiAgdmFyIFNWR19OT1RfU1VQUE9SVEVEID0gJ1NWR19OT1RfU1VQUE9SVEVEJztcbiAgdmFyIFNWR19JTlZBTElEID0gJ1NWR19JTlZBTElEJztcbiAgdmFyIEFUVFJJQlVURV9FWENMVVNJT05fTkFNRVMgPSBbJ3NyYycsICdhbHQnLCAnb25sb2FkJywgJ29uZXJyb3InXTtcbiAgdmFyIEFfRUxFTUVOVCA9IGRvY3VtZW50W19DUkVBVEVfRUxFTUVOVF9dKCdhJyk7XG4gIHZhciBJU19TVkdfU1VQUE9SVEVEID0gdHlwZW9mIFNWR1JlY3QgIT0gX1VOREVGSU5FRF87XG4gIHZhciBERUZBVUxUX09QVElPTlMgPSB7XG4gICAgdXNlQ2FjaGU6IHRydWUsXG4gICAgY29weUF0dHJpYnV0ZXM6IHRydWUsXG4gICAgbWFrZUlkc1VuaXF1ZTogdHJ1ZVxuICB9O1xuICAvLyBNYXAgb2YgSVJJIHJlZmVyZW5jZWFibGUgdGFnIG5hbWVzIHRvIHByb3BlcnRpZXMgdGhhdCBjYW4gcmVmZXJlbmNlIHRoZW0uIFRoaXMgaXMgZGVmaW5lZCBpblxuICAvLyBodHRwczovL3d3dy53My5vcmcvVFIvU1ZHMTEvbGlua2luZy5odG1sI3Byb2Nlc3NpbmdJUklcbiAgdmFyIElSSV9UQUdfUFJPUEVSVElFU19NQVAgPSB7XG4gICAgY2xpcFBhdGg6IFsnY2xpcC1wYXRoJ10sXG4gICAgJ2NvbG9yLXByb2ZpbGUnOiBOVUxMLFxuICAgIGN1cnNvcjogTlVMTCxcbiAgICBmaWx0ZXI6IE5VTEwsXG4gICAgbGluZWFyR3JhZGllbnQ6IFsnZmlsbCcsICdzdHJva2UnXSxcbiAgICBtYXJrZXI6IFsnbWFya2VyJywgJ21hcmtlci1lbmQnLCAnbWFya2VyLW1pZCcsICdtYXJrZXItc3RhcnQnXSxcbiAgICBtYXNrOiBOVUxMLFxuICAgIHBhdHRlcm46IFsnZmlsbCcsICdzdHJva2UnXSxcbiAgICByYWRpYWxHcmFkaWVudDogWydmaWxsJywgJ3N0cm9rZSddXG4gIH07XG4gIHZhciBJTkpFQ1RFRCA9IDE7XG4gIHZhciBGQUlMID0gMjtcblxuICB2YXIgdW5pcXVlSWRDb3VudGVyID0gMTtcbiAgdmFyIHhtbFNlcmlhbGl6ZXI7XG4gIHZhciBkb21QYXJzZXI7XG5cblxuICAvLyBjcmVhdGVzIGFuIFNWRyBkb2N1bWVudCBmcm9tIGFuIFNWRyBzdHJpbmdcbiAgZnVuY3Rpb24gc3ZnU3RyaW5nVG9TdmdEb2Moc3ZnU3RyKSB7XG4gICAgZG9tUGFyc2VyID0gZG9tUGFyc2VyIHx8IG5ldyBET01QYXJzZXIoKTtcbiAgICByZXR1cm4gZG9tUGFyc2VyLnBhcnNlRnJvbVN0cmluZyhzdmdTdHIsICd0ZXh0L3htbCcpO1xuICB9XG5cblxuICAvLyBzZWFyaWFsaXplcyBhbiBTVkcgZWxlbWVudCB0byBhbiBTVkcgc3RyaW5nXG4gIGZ1bmN0aW9uIHN2Z0VsZW1Ub1N2Z1N0cmluZyhzdmdFbGVtZW50KSB7XG4gICAgeG1sU2VyaWFsaXplciA9IHhtbFNlcmlhbGl6ZXIgfHwgbmV3IFhNTFNlcmlhbGl6ZXIoKTtcbiAgICByZXR1cm4geG1sU2VyaWFsaXplci5zZXJpYWxpemVUb1N0cmluZyhzdmdFbGVtZW50KTtcbiAgfVxuXG5cbiAgLy8gUmV0dXJucyB0aGUgYWJzb2x1dGUgdXJsIGZvciB0aGUgc3BlY2lmaWVkIHVybFxuICBmdW5jdGlvbiBnZXRBYnNvbHV0ZVVybCh1cmwpIHtcbiAgICBBX0VMRU1FTlQuaHJlZiA9IHVybDtcbiAgICByZXR1cm4gQV9FTEVNRU5ULmhyZWY7XG4gIH1cblxuXG4gIC8vIExvYWQgc3ZnIHdpdGggYW4gWEhSIHJlcXVlc3RcbiAgZnVuY3Rpb24gbG9hZFN2Zyh1cmwsIGNhbGxiYWNrLCBlcnJvckNhbGxiYWNrKSB7XG4gICAgaWYgKHVybCkge1xuICAgICAgdmFyIHJlcSA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgICAgcmVxLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAocmVxLnJlYWR5U3RhdGUgPT0gNCkge1xuICAgICAgICAgIC8vIHJlYWR5U3RhdGUgaXMgRE9ORVxuICAgICAgICAgIHZhciBzdGF0dXMgPSByZXEuc3RhdHVzO1xuICAgICAgICAgIGlmIChzdGF0dXMgPT0gMjAwKSB7XG4gICAgICAgICAgICAvLyByZXF1ZXN0IHN0YXR1cyBpcyBPS1xuICAgICAgICAgICAgY2FsbGJhY2socmVxLnJlc3BvbnNlWE1MLCByZXEucmVzcG9uc2VUZXh0LnRyaW0oKSk7XG4gICAgICAgICAgfSBlbHNlIGlmIChzdGF0dXMgPj0gNDAwKSB7XG4gICAgICAgICAgICAvLyByZXF1ZXN0IHN0YXR1cyBpcyBlcnJvciAoNHh4IG9yIDV4eClcbiAgICAgICAgICAgIGVycm9yQ2FsbGJhY2soKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHN0YXR1cyA9PSAwKSB7XG4gICAgICAgICAgICAvLyByZXF1ZXN0IHN0YXR1cyAwIGNhbiBpbmRpY2F0ZSBhIGZhaWxlZCBjcm9zcy1kb21haW4gY2FsbFxuICAgICAgICAgICAgZXJyb3JDYWxsYmFjaygpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIHJlcS5vcGVuKCdHRVQnLCB1cmwsIHRydWUpO1xuICAgICAgcmVxLnNlbmQoKTtcbiAgICB9XG4gIH1cblxuXG4gIC8vIENvcHkgYXR0cmlidXRlcyBmcm9tIGltZyBlbGVtZW50IHRvIHN2ZyBlbGVtZW50XG4gIGZ1bmN0aW9uIGNvcHlBdHRyaWJ1dGVzKGltZ0VsZW0sIHN2Z0VsZW0pIHtcbiAgICB2YXIgYXR0cmlidXRlO1xuICAgIHZhciBhdHRyaWJ1dGVOYW1lO1xuICAgIHZhciBhdHRyaWJ1dGVWYWx1ZTtcbiAgICB2YXIgYXR0cmlidXRlcyA9IGltZ0VsZW0uYXR0cmlidXRlcztcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGF0dHJpYnV0ZXNbX0xFTkdUSF9dOyBpKyspIHtcbiAgICAgIGF0dHJpYnV0ZSA9IGF0dHJpYnV0ZXNbaV07XG4gICAgICBhdHRyaWJ1dGVOYW1lID0gYXR0cmlidXRlLm5hbWU7XG4gICAgICAvLyBPbmx5IGNvcHkgYXR0cmlidXRlcyBub3QgZXhwbGljaXRseSBleGNsdWRlZCBmcm9tIGNvcHlpbmdcbiAgICAgIGlmIChBVFRSSUJVVEVfRVhDTFVTSU9OX05BTUVTLmluZGV4T2YoYXR0cmlidXRlTmFtZSkgPT0gLTEpIHtcbiAgICAgICAgYXR0cmlidXRlVmFsdWUgPSBhdHRyaWJ1dGUudmFsdWU7XG4gICAgICAgIC8vIElmIGltZyBhdHRyaWJ1dGUgaXMgXCJ0aXRsZVwiLCBpbnNlcnQgYSB0aXRsZSBlbGVtZW50IGludG8gU1ZHIGVsZW1lbnRcbiAgICAgICAgaWYgKGF0dHJpYnV0ZU5hbWUgPT0gX1RJVExFXykge1xuICAgICAgICAgIHZhciB0aXRsZUVsZW07XG4gICAgICAgICAgdmFyIGZpcnN0RWxlbWVudENoaWxkID0gc3ZnRWxlbS5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICAgICAgICBpZiAoZmlyc3RFbGVtZW50Q2hpbGQgJiYgZmlyc3RFbGVtZW50Q2hpbGQubG9jYWxOYW1lLnRvTG93ZXJDYXNlKCkgPT0gX1RJVExFXykge1xuICAgICAgICAgICAgLy8gSWYgdGhlIFNWRyBlbGVtZW50J3MgZmlyc3QgY2hpbGQgaXMgYSB0aXRsZSBlbGVtZW50LCBrZWVwIGl0IGFzIHRoZSB0aXRsZSBlbGVtZW50XG4gICAgICAgICAgICB0aXRsZUVsZW0gPSBmaXJzdEVsZW1lbnRDaGlsZDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gSWYgdGhlIFNWRyBlbGVtZW50J3MgZmlyc3QgY2hpbGQgZWxlbWVudCBpcyBub3QgYSB0aXRsZSBlbGVtZW50LCBjcmVhdGUgYSBuZXcgdGl0bGVcbiAgICAgICAgICAgIC8vIGVsZSxlbXQgYW5kIHNldCBpdCBhcyB0aGUgZmlyc3QgY2hpbGRcbiAgICAgICAgICAgIHRpdGxlRWxlbSA9IGRvY3VtZW50W19DUkVBVEVfRUxFTUVOVF8gKyAnTlMnXSgnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLCBfVElUTEVfKTtcbiAgICAgICAgICAgIHN2Z0VsZW0uaW5zZXJ0QmVmb3JlKHRpdGxlRWxlbSwgZmlyc3RFbGVtZW50Q2hpbGQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBTZXQgbmV3IHRpdGxlIGNvbnRlbnRcbiAgICAgICAgICB0aXRsZUVsZW0udGV4dENvbnRlbnQgPSBhdHRyaWJ1dGVWYWx1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBTZXQgaW1nIGF0dHJpYnV0ZSB0byBzdmcgZWxlbWVudFxuICAgICAgICAgIHN2Z0VsZW1bX1NFVF9BVFRSSUJVVEVfXShhdHRyaWJ1dGVOYW1lLCBhdHRyaWJ1dGVWYWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuXG4gIC8vIFRoaXMgZnVuY3Rpb24gYXBwZW5kcyBhIHN1ZmZpeCB0byBJRHMgb2YgcmVmZXJlbmNlZCBlbGVtZW50cyBpbiB0aGUgPGRlZnM+IGluIG9yZGVyIHRvICB0byBhdm9pZCBJRCBjb2xsaXNpb25cbiAgLy8gYmV0d2VlbiBtdWx0aXBsZSBpbmplY3RlZCBTVkdzLiBUaGUgc3VmZml4IGhhcyB0aGUgZm9ybSBcIi0taW5qZWN0LVhcIiwgd2hlcmUgWCBpcyBhIHJ1bm5pbmcgbnVtYmVyIHdoaWNoIGlzXG4gIC8vIGluY3JlbWVudGVkIHdpdGggZWFjaCBpbmplY3Rpb24uIFJlZmVyZW5jZXMgdG8gdGhlIElEcyBhcmUgYWRqdXN0ZWQgYWNjb3JkaW5nbHkuXG4gIC8vIFdlIGFzc3VtZSB0aGEgYWxsIElEcyB3aXRoaW4gdGhlIGluamVjdGVkIFNWRyBhcmUgdW5pcXVlLCB0aGVyZWZvcmUgdGhlIHNhbWUgc3VmZml4IGNhbiBiZSB1c2VkIGZvciBhbGwgSURzIG9mIG9uZVxuICAvLyBpbmplY3RlZCBTVkcuXG4gIC8vIElmIHRoZSBvbmx5UmVmZXJlbmNlZCBhcmd1bWVudCBpcyBzZXQgdG8gdHJ1ZSwgb25seSB0aG9zZSBJRHMgd2lsbCBiZSBtYWRlIHVuaXF1ZSB0aGF0IGFyZSByZWZlcmVuY2VkIGZyb20gd2l0aGluIHRoZSBTVkdcbiAgZnVuY3Rpb24gbWFrZUlkc1VuaXF1ZShzdmdFbGVtLCBvbmx5UmVmZXJlbmNlZCkge1xuICAgIHZhciBpZFN1ZmZpeCA9IElEX1NVRkZJWCArIHVuaXF1ZUlkQ291bnRlcisrO1xuICAgIC8vIFJlZ3VsYXIgZXhwcmVzc2lvbiBmb3IgZnVuY3Rpb25hbCBub3RhdGlvbnMgb2YgYW4gSVJJIHJlZmVyZW5jZXMuIFRoaXMgd2lsbCBmaW5kIG9jY3VyZW5jZXMgaW4gdGhlIGZvcm1cbiAgICAvLyB1cmwoI2FueUlkKSBvciB1cmwoXCIjYW55SWRcIikgKGZvciBJbnRlcm5ldCBFeHBsb3JlcikgYW5kIGNhcHR1cmUgdGhlIHJlZmVyZW5jZWQgSURcbiAgICB2YXIgZnVuY0lyaVJlZ2V4ID0gL3VybFxcKFwiPyMoW2EtekEtWl1bXFx3Oi4tXSopXCI/XFwpL2c7XG4gICAgLy8gR2V0IGFsbCBlbGVtZW50cyB3aXRoIGFuIElELiBUaGUgU1ZHIHNwZWMgcmVjb21tZW5kcyB0byBwdXQgcmVmZXJlbmNlZCBlbGVtZW50cyBpbnNpZGUgPGRlZnM+IGVsZW1lbnRzLCBidXRcbiAgICAvLyB0aGlzIGlzIG5vdCBhIHJlcXVpcmVtZW50LCB0aGVyZWZvcmUgd2UgaGF2ZSB0byBzZWFyY2ggZm9yIElEcyBpbiB0aGUgd2hvbGUgU1ZHLlxuICAgIHZhciBpZEVsZW1lbnRzID0gc3ZnRWxlbS5xdWVyeVNlbGVjdG9yQWxsKCdbaWRdJyk7XG4gICAgdmFyIGlkRWxlbTtcbiAgICAvLyBBbiBvYmplY3QgY29udGFpbmluZyByZWZlcmVuY2VkIElEcyAgYXMga2V5cyBpcyB1c2VkIGlmIG9ubHkgcmVmZXJlbmNlZCBJRHMgc2hvdWxkIGJlIHVuaXF1aWZpZWQuXG4gICAgLy8gSWYgdGhpcyBvYmplY3QgZG9lcyBub3QgZXhpc3QsIGFsbCBJRHMgd2lsbCBiZSB1bmlxdWlmaWVkLlxuICAgIHZhciByZWZlcmVuY2VkSWRzID0gb25seVJlZmVyZW5jZWQgPyBbXSA6IE5VTEw7XG4gICAgdmFyIHRhZ05hbWU7XG4gICAgdmFyIGlyaVRhZ05hbWVzID0ge307XG4gICAgdmFyIGlyaVByb3BlcnRpZXMgPSBbXTtcbiAgICB2YXIgY2hhbmdlZCA9IGZhbHNlO1xuICAgIHZhciBpLCBqO1xuXG4gICAgaWYgKGlkRWxlbWVudHNbX0xFTkdUSF9dKSB7XG4gICAgICAvLyBNYWtlIGFsbCBJRHMgdW5pcXVlIGJ5IGFkZGluZyB0aGUgSUQgc3VmZml4IGFuZCBjb2xsZWN0IGFsbCBlbmNvdW50ZXJlZCB0YWcgbmFtZXNcbiAgICAgIC8vIHRoYXQgYXJlIElSSSByZWZlcmVuY2VhYmxlIGZyb20gcHJvcGVyaXRpZXMuXG4gICAgICBmb3IgKGkgPSAwOyBpIDwgaWRFbGVtZW50c1tfTEVOR1RIX107IGkrKykge1xuICAgICAgICB0YWdOYW1lID0gaWRFbGVtZW50c1tpXS5sb2NhbE5hbWU7IC8vIFVzZSBub24tbmFtZXNwYWNlZCB0YWcgbmFtZVxuICAgICAgICAvLyBNYWtlIElEIHVuaXF1ZSBpZiB0YWcgbmFtZSBpcyBJUkkgcmVmZXJlbmNlYWJsZVxuICAgICAgICBpZiAodGFnTmFtZSBpbiBJUklfVEFHX1BST1BFUlRJRVNfTUFQKSB7XG4gICAgICAgICAgaXJpVGFnTmFtZXNbdGFnTmFtZV0gPSAxO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvLyBHZXQgYWxsIHByb3BlcnRpZXMgdGhhdCBhcmUgbWFwcGVkIHRvIHRoZSBmb3VuZCBJUkkgcmVmZXJlbmNlYWJsZSB0YWdzXG4gICAgICBmb3IgKHRhZ05hbWUgaW4gaXJpVGFnTmFtZXMpIHtcbiAgICAgICAgKElSSV9UQUdfUFJPUEVSVElFU19NQVBbdGFnTmFtZV0gfHwgW3RhZ05hbWVdKS5mb3JFYWNoKGZ1bmN0aW9uIChtYXBwZWRQcm9wZXJ0eSkge1xuICAgICAgICAgIC8vIEFkZCBtYXBwZWQgcHJvcGVydGllcyB0byBhcnJheSBvZiBpcmkgcmVmZXJlbmNpbmcgcHJvcGVydGllcy5cbiAgICAgICAgICAvLyBVc2UgbGluZWFyIHNlYXJjaCBoZXJlIGJlY2F1c2UgdGhlIG51bWJlciBvZiBwb3NzaWJsZSBlbnRyaWVzIGlzIHZlcnkgc21hbGwgKG1heGltdW0gMTEpXG4gICAgICAgICAgaWYgKGlyaVByb3BlcnRpZXMuaW5kZXhPZihtYXBwZWRQcm9wZXJ0eSkgPCAwKSB7XG4gICAgICAgICAgICBpcmlQcm9wZXJ0aWVzLnB1c2gobWFwcGVkUHJvcGVydHkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBpZiAoaXJpUHJvcGVydGllc1tfTEVOR1RIX10pIHtcbiAgICAgICAgLy8gQWRkIFwic3R5bGVcIiB0byBwcm9wZXJ0aWVzLCBiZWNhdXNlIGl0IG1heSBjb250YWluIHJlZmVyZW5jZXMgaW4gdGhlIGZvcm0gJ3N0eWxlPVwiZmlsbDp1cmwoI215RmlsbClcIidcbiAgICAgICAgaXJpUHJvcGVydGllcy5wdXNoKF9TVFlMRV8pO1xuICAgICAgfVxuICAgICAgLy8gUnVuIHRocm91Z2ggYWxsIGVsZW1lbnRzIG9mIHRoZSBTVkcgYW5kIHJlcGxhY2UgSURzIGluIHJlZmVyZW5jZXMuXG4gICAgICAvLyBUbyBnZXQgYWxsIGRlc2NlbmRpbmcgZWxlbWVudHMsIGdldEVsZW1lbnRzQnlUYWdOYW1lKCcqJykgc2VlbXMgdG8gcGVyZm9ybSBmYXN0ZXIgdGhhbiBxdWVyeVNlbGVjdG9yQWxsKCcqJykuXG4gICAgICAvLyBTaW5jZSBzdmdFbGVtLmdldEVsZW1lbnRzQnlUYWdOYW1lKCcqJykgZG9lcyBub3QgcmV0dXJuIHRoZSBzdmcgZWxlbWVudCBpdHNlbGYsIHdlIGhhdmUgdG8gaGFuZGxlIGl0IHNlcGFyYXRlbHkuXG4gICAgICB2YXIgZGVzY0VsZW1lbnRzID0gc3ZnRWxlbVtfR0VUX0VMRU1FTlRTX0JZX1RBR19OQU1FX10oJyonKTtcbiAgICAgIHZhciBlbGVtZW50ID0gc3ZnRWxlbTtcbiAgICAgIHZhciBwcm9wZXJ0eU5hbWU7XG4gICAgICB2YXIgdmFsdWU7XG4gICAgICB2YXIgbmV3VmFsdWU7XG4gICAgICBmb3IgKGkgPSAtMTsgZWxlbWVudCAhPSBOVUxMOykge1xuICAgICAgICBpZiAoZWxlbWVudC5sb2NhbE5hbWUgPT0gX1NUWUxFXykge1xuICAgICAgICAgIC8vIElmIGVsZW1lbnQgaXMgYSBzdHlsZSBlbGVtZW50LCByZXBsYWNlIElEcyBpbiBhbGwgb2NjdXJlbmNlcyBvZiBcInVybCgjYW55SWQpXCIgaW4gdGV4dCBjb250ZW50XG4gICAgICAgICAgdmFsdWUgPSBlbGVtZW50LnRleHRDb250ZW50O1xuICAgICAgICAgIG5ld1ZhbHVlID0gdmFsdWUgJiYgdmFsdWUucmVwbGFjZShmdW5jSXJpUmVnZXgsIGZ1bmN0aW9uKG1hdGNoLCBpZCkge1xuICAgICAgICAgICAgaWYgKHJlZmVyZW5jZWRJZHMpIHtcbiAgICAgICAgICAgICAgcmVmZXJlbmNlZElkc1tpZF0gPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuICd1cmwoIycgKyBpZCArIGlkU3VmZml4ICsgJyknO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIGlmIChuZXdWYWx1ZSAhPT0gdmFsdWUpIHtcbiAgICAgICAgICAgIGVsZW1lbnQudGV4dENvbnRlbnQgPSBuZXdWYWx1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoZWxlbWVudC5oYXNBdHRyaWJ1dGVzKCkpIHtcbiAgICAgICAgICAvLyBSdW4gdGhyb3VnaCBhbGwgcHJvcGVydHkgbmFtZXMgZm9yIHdoaWNoIElEcyB3ZXJlIGZvdW5kXG4gICAgICAgICAgZm9yIChqID0gMDsgaiA8IGlyaVByb3BlcnRpZXNbX0xFTkdUSF9dOyBqKyspIHtcbiAgICAgICAgICAgIHByb3BlcnR5TmFtZSA9IGlyaVByb3BlcnRpZXNbal07XG4gICAgICAgICAgICB2YWx1ZSA9IGVsZW1lbnRbX0dFVF9BVFRSSUJVVEVfXShwcm9wZXJ0eU5hbWUpO1xuICAgICAgICAgICAgbmV3VmFsdWUgPSB2YWx1ZSAmJiB2YWx1ZS5yZXBsYWNlKGZ1bmNJcmlSZWdleCwgZnVuY3Rpb24obWF0Y2gsIGlkKSB7XG4gICAgICAgICAgICAgIGlmIChyZWZlcmVuY2VkSWRzKSB7XG4gICAgICAgICAgICAgICAgcmVmZXJlbmNlZElkc1tpZF0gPSAxO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuICd1cmwoIycgKyBpZCArIGlkU3VmZml4ICsgJyknO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAobmV3VmFsdWUgIT09IHZhbHVlKSB7XG4gICAgICAgICAgICAgIGVsZW1lbnRbX1NFVF9BVFRSSUJVVEVfXShwcm9wZXJ0eU5hbWUsIG5ld1ZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gUmVwbGFjZSBJRHMgaW4geGxpbms6cmVmIGFuZCBocmVmIGF0dHJpYnV0ZXNcbiAgICAgICAgICBbJ3hsaW5rOmhyZWYnLCAnaHJlZiddLmZvckVhY2goZnVuY3Rpb24ocmVmQXR0ck5hbWUpIHtcbiAgICAgICAgICAgIHZhciBpcmkgPSBlbGVtZW50W19HRVRfQVRUUklCVVRFX10ocmVmQXR0ck5hbWUpO1xuICAgICAgICAgICAgaWYgKC9eXFxzKiMvLnRlc3QoaXJpKSkgeyAvLyBDaGVjayBpZiBpcmkgaXMgbm9uLW51bGwgYW5kIGludGVybmFsIHJlZmVyZW5jZVxuICAgICAgICAgICAgICBpcmkgPSBpcmkudHJpbSgpO1xuICAgICAgICAgICAgICBlbGVtZW50W19TRVRfQVRUUklCVVRFX10ocmVmQXR0ck5hbWUsIGlyaSArIGlkU3VmZml4KTtcbiAgICAgICAgICAgICAgaWYgKHJlZmVyZW5jZWRJZHMpIHtcbiAgICAgICAgICAgICAgICAvLyBBZGQgSUQgdG8gcmVmZXJlbmNlZCBJRHNcbiAgICAgICAgICAgICAgICByZWZlcmVuY2VkSWRzW2lyaS5zdWJzdHJpbmcoMSldID0gMTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsZW1lbnQgPSBkZXNjRWxlbWVudHNbKytpXTtcbiAgICAgIH1cbiAgICAgIGZvciAoaSA9IDA7IGkgPCBpZEVsZW1lbnRzW19MRU5HVEhfXTsgaSsrKSB7XG4gICAgICAgIGlkRWxlbSA9IGlkRWxlbWVudHNbaV07XG4gICAgICAgIC8vIElmIHNldCBvZiByZWZlcmVuY2VkIElEcyBleGlzdHMsIG1ha2Ugb25seSByZWZlcmVuY2VkIElEcyB1bmlxdWUsXG4gICAgICAgIC8vIG90aGVyd2lzZSBtYWtlIGFsbCBJRHMgdW5pcXVlLlxuICAgICAgICBpZiAoIXJlZmVyZW5jZWRJZHMgfHwgcmVmZXJlbmNlZElkc1tpZEVsZW0uaWRdKSB7XG4gICAgICAgICAgLy8gQWRkIHN1ZmZpeCB0byBlbGVtZW50J3MgSURcbiAgICAgICAgICBpZEVsZW0uaWQgKz0gaWRTdWZmaXg7XG4gICAgICAgICAgY2hhbmdlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgLy8gcmV0dXJuIHRydWUgaWYgU1ZHIGVsZW1lbnQgaGFzIGNoYW5nZWRcbiAgICByZXR1cm4gY2hhbmdlZDtcbiAgfVxuXG5cbiAgLy8gRm9yIGNhY2hlZCBTVkdzIHRoZSBJRHMgYXJlIG1hZGUgdW5pcXVlIGJ5IHNpbXBseSByZXBsYWNpbmcgdGhlIGFscmVhZHkgaW5zZXJ0ZWQgdW5pcXVlIElEcyB3aXRoIGFcbiAgLy8gaGlnaGVyIElEIGNvdW50ZXIuIFRoaXMgaXMgbXVjaCBtb3JlIHBlcmZvcm1hbnQgdGhhbiBhIGNhbGwgdG8gbWFrZUlkc1VuaXF1ZSgpLlxuICBmdW5jdGlvbiBtYWtlSWRzVW5pcXVlQ2FjaGVkKHN2Z1N0cmluZykge1xuICAgIHJldHVybiBzdmdTdHJpbmcucmVwbGFjZShJRF9TVUZGSVhfUkVHRVgsIElEX1NVRkZJWCArIHVuaXF1ZUlkQ291bnRlcisrKTtcbiAgfVxuXG5cbiAgLy8gSW5qZWN0IFNWRyBieSByZXBsYWNpbmcgdGhlIGltZyBlbGVtZW50IHdpdGggdGhlIFNWRyBlbGVtZW50IGluIHRoZSBET01cbiAgZnVuY3Rpb24gaW5qZWN0KGltZ0VsZW0sIHN2Z0VsZW0sIGFic1VybCwgb3B0aW9ucykge1xuICAgIGlmIChzdmdFbGVtKSB7XG4gICAgICBzdmdFbGVtW19TRVRfQVRUUklCVVRFX10oJ2RhdGEtaW5qZWN0LXVybCcsIGFic1VybCk7XG4gICAgICB2YXIgcGFyZW50Tm9kZSA9IGltZ0VsZW0ucGFyZW50Tm9kZTtcbiAgICAgIGlmIChwYXJlbnROb2RlKSB7XG4gICAgICAgIGlmIChvcHRpb25zLmNvcHlBdHRyaWJ1dGVzKSB7XG4gICAgICAgICAgY29weUF0dHJpYnV0ZXMoaW1nRWxlbSwgc3ZnRWxlbSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gSW52b2tlIGJlZm9yZUluamVjdCBob29rIGlmIHNldFxuICAgICAgICB2YXIgYmVmb3JlSW5qZWN0ID0gb3B0aW9ucy5iZWZvcmVJbmplY3Q7XG4gICAgICAgIHZhciBpbmplY3RFbGVtID0gKGJlZm9yZUluamVjdCAmJiBiZWZvcmVJbmplY3QoaW1nRWxlbSwgc3ZnRWxlbSkpIHx8IHN2Z0VsZW07XG4gICAgICAgIC8vIFJlcGxhY2UgaW1nIGVsZW1lbnQgd2l0aCBuZXcgZWxlbWVudC4gVGhpcyBpcyB0aGUgYWN0dWFsIGluamVjdGlvbi5cbiAgICAgICAgcGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQoaW5qZWN0RWxlbSwgaW1nRWxlbSk7XG4gICAgICAgIC8vIE1hcmsgaW1nIGVsZW1lbnQgYXMgaW5qZWN0ZWRcbiAgICAgICAgaW1nRWxlbVtfX1NWR0lOSkVDVF0gPSBJTkpFQ1RFRDtcbiAgICAgICAgcmVtb3ZlT25Mb2FkQXR0cmlidXRlKGltZ0VsZW0pO1xuICAgICAgICAvLyBJbnZva2UgYWZ0ZXJJbmplY3QgaG9vayBpZiBzZXRcbiAgICAgICAgdmFyIGFmdGVySW5qZWN0ID0gb3B0aW9ucy5hZnRlckluamVjdDtcbiAgICAgICAgaWYgKGFmdGVySW5qZWN0KSB7XG4gICAgICAgICAgYWZ0ZXJJbmplY3QoaW1nRWxlbSwgaW5qZWN0RWxlbSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3ZnSW52YWxpZChpbWdFbGVtLCBvcHRpb25zKTtcbiAgICB9XG4gIH1cblxuXG4gIC8vIE1lcmdlcyBhbnkgbnVtYmVyIG9mIG9wdGlvbnMgb2JqZWN0cyBpbnRvIGEgbmV3IG9iamVjdFxuICBmdW5jdGlvbiBtZXJnZU9wdGlvbnMoKSB7XG4gICAgdmFyIG1lcmdlZE9wdGlvbnMgPSB7fTtcbiAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgICAvLyBJdGVyYXRlIG92ZXIgYWxsIHNwZWNpZmllZCBvcHRpb25zIG9iamVjdHMgYW5kIGFkZCBhbGwgcHJvcGVydGllcyB0byB0aGUgbmV3IG9wdGlvbnMgb2JqZWN0XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmdzW19MRU5HVEhfXTsgaSsrKSB7XG4gICAgICB2YXIgYXJndW1lbnQgPSBhcmdzW2ldO1xuICAgICAgICBmb3IgKHZhciBrZXkgaW4gYXJndW1lbnQpIHtcbiAgICAgICAgICBpZiAoYXJndW1lbnQuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgbWVyZ2VkT3B0aW9uc1trZXldID0gYXJndW1lbnRba2V5XTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICByZXR1cm4gbWVyZ2VkT3B0aW9ucztcbiAgfVxuXG5cbiAgLy8gQWRkcyB0aGUgc3BlY2lmaWVkIENTUyB0byB0aGUgZG9jdW1lbnQncyA8aGVhZD4gZWxlbWVudFxuICBmdW5jdGlvbiBhZGRTdHlsZVRvSGVhZChjc3MpIHtcbiAgICB2YXIgaGVhZCA9IGRvY3VtZW50W19HRVRfRUxFTUVOVFNfQllfVEFHX05BTUVfXSgnaGVhZCcpWzBdO1xuICAgIGlmIChoZWFkKSB7XG4gICAgICB2YXIgc3R5bGUgPSBkb2N1bWVudFtfQ1JFQVRFX0VMRU1FTlRfXShfU1RZTEVfKTtcbiAgICAgIHN0eWxlLnR5cGUgPSAndGV4dC9jc3MnO1xuICAgICAgc3R5bGUuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoY3NzKSk7XG4gICAgICBoZWFkLmFwcGVuZENoaWxkKHN0eWxlKTtcbiAgICB9XG4gIH1cblxuXG4gIC8vIEJ1aWxkcyBhbiBTVkcgZWxlbWVudCBmcm9tIHRoZSBzcGVjaWZpZWQgU1ZHIHN0cmluZ1xuICBmdW5jdGlvbiBidWlsZFN2Z0VsZW1lbnQoc3ZnU3RyLCB2ZXJpZnkpIHtcbiAgICBpZiAodmVyaWZ5KSB7XG4gICAgICB2YXIgc3ZnRG9jO1xuICAgICAgdHJ5IHtcbiAgICAgICAgLy8gUGFyc2UgdGhlIFNWRyBzdHJpbmcgd2l0aCBET01QYXJzZXJcbiAgICAgICAgc3ZnRG9jID0gc3ZnU3RyaW5nVG9TdmdEb2Moc3ZnU3RyKTtcbiAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICByZXR1cm4gTlVMTDtcbiAgICAgIH1cbiAgICAgIGlmIChzdmdEb2NbX0dFVF9FTEVNRU5UU19CWV9UQUdfTkFNRV9dKCdwYXJzZXJlcnJvcicpW19MRU5HVEhfXSkge1xuICAgICAgICAvLyBET01QYXJzZXIgZG9lcyBub3QgdGhyb3cgYW4gZXhjZXB0aW9uLCBidXQgaW5zdGVhZCBwdXRzIHBhcnNlcmVycm9yIHRhZ3MgaW4gdGhlIGRvY3VtZW50XG4gICAgICAgIHJldHVybiBOVUxMO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHN2Z0RvYy5kb2N1bWVudEVsZW1lbnQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgIGRpdi5pbm5lckhUTUwgPSBzdmdTdHI7XG4gICAgICByZXR1cm4gZGl2LmZpcnN0RWxlbWVudENoaWxkO1xuICAgIH1cbiAgfVxuXG5cbiAgZnVuY3Rpb24gcmVtb3ZlT25Mb2FkQXR0cmlidXRlKGltZ0VsZW0pIHtcbiAgICAvLyBSZW1vdmUgdGhlIG9ubG9hZCBhdHRyaWJ1dGUuIFNob3VsZCBvbmx5IGJlIHVzZWQgdG8gcmVtb3ZlIHRoZSB1bnN0eWxlZCBpbWFnZSBmbGFzaCBwcm90ZWN0aW9uIGFuZFxuICAgIC8vIG1ha2UgdGhlIGVsZW1lbnQgdmlzaWJsZSwgbm90IGZvciByZW1vdmluZyB0aGUgZXZlbnQgbGlzdGVuZXIuXG4gICAgaW1nRWxlbS5yZW1vdmVBdHRyaWJ1dGUoJ29ubG9hZCcpO1xuICB9XG5cblxuICBmdW5jdGlvbiBlcnJvck1lc3NhZ2UobXNnKSB7XG4gICAgY29uc29sZS5lcnJvcignU1ZHSW5qZWN0OiAnICsgbXNnKTtcbiAgfVxuXG5cbiAgZnVuY3Rpb24gZmFpbChpbWdFbGVtLCBzdGF0dXMsIG9wdGlvbnMpIHtcbiAgICBpbWdFbGVtW19fU1ZHSU5KRUNUXSA9IEZBSUw7XG4gICAgaWYgKG9wdGlvbnMub25GYWlsKSB7XG4gICAgICBvcHRpb25zLm9uRmFpbChpbWdFbGVtLCBzdGF0dXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICBlcnJvck1lc3NhZ2Uoc3RhdHVzKTtcbiAgICB9XG4gIH1cblxuXG4gIGZ1bmN0aW9uIHN2Z0ludmFsaWQoaW1nRWxlbSwgb3B0aW9ucykge1xuICAgIHJlbW92ZU9uTG9hZEF0dHJpYnV0ZShpbWdFbGVtKTtcbiAgICBmYWlsKGltZ0VsZW0sIFNWR19JTlZBTElELCBvcHRpb25zKTtcbiAgfVxuXG5cbiAgZnVuY3Rpb24gc3ZnTm90U3VwcG9ydGVkKGltZ0VsZW0sIG9wdGlvbnMpIHtcbiAgICByZW1vdmVPbkxvYWRBdHRyaWJ1dGUoaW1nRWxlbSk7XG4gICAgZmFpbChpbWdFbGVtLCBTVkdfTk9UX1NVUFBPUlRFRCwgb3B0aW9ucyk7XG4gIH1cblxuXG4gIGZ1bmN0aW9uIGxvYWRGYWlsKGltZ0VsZW0sIG9wdGlvbnMpIHtcbiAgICBmYWlsKGltZ0VsZW0sIExPQURfRkFJTCwgb3B0aW9ucyk7XG4gIH1cblxuXG4gIGZ1bmN0aW9uIHJlbW92ZUV2ZW50TGlzdGVuZXJzKGltZ0VsZW0pIHtcbiAgICBpbWdFbGVtLm9ubG9hZCA9IE5VTEw7XG4gICAgaW1nRWxlbS5vbmVycm9yID0gTlVMTDtcbiAgfVxuXG5cbiAgZnVuY3Rpb24gaW1nTm90U2V0KG1zZykge1xuICAgIGVycm9yTWVzc2FnZSgnbm8gaW1nIGVsZW1lbnQnKTtcbiAgfVxuXG5cbiAgZnVuY3Rpb24gY3JlYXRlU1ZHSW5qZWN0KGdsb2JhbE5hbWUsIG9wdGlvbnMpIHtcbiAgICB2YXIgZGVmYXVsdE9wdGlvbnMgPSBtZXJnZU9wdGlvbnMoREVGQVVMVF9PUFRJT05TLCBvcHRpb25zKTtcbiAgICB2YXIgc3ZnTG9hZENhY2hlID0ge307XG5cbiAgICBpZiAoSVNfU1ZHX1NVUFBPUlRFRCkge1xuICAgICAgLy8gSWYgdGhlIGJyb3dzZXIgc3VwcG9ydHMgU1ZHLCBhZGQgYSBzbWFsbCBzdHlsZXNoZWV0IHRoYXQgaGlkZXMgdGhlIDxpbWc+IGVsZW1lbnRzIHVudGlsXG4gICAgICAvLyBpbmplY3Rpb24gaXMgZmluaXNoZWQuIFRoaXMgYXZvaWRzIHNob3dpbmcgdGhlIHVuc3R5bGVkIFNWR3MgYmVmb3JlIHN0eWxlIGlzIGFwcGxpZWQuXG4gICAgICBhZGRTdHlsZVRvSGVhZCgnaW1nW29ubG9hZF49XCInICsgZ2xvYmFsTmFtZSArICcoXCJde3Zpc2liaWxpdHk6aGlkZGVuO30nKTtcbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIFNWR0luamVjdFxuICAgICAqXG4gICAgICogSW5qZWN0cyB0aGUgU1ZHIHNwZWNpZmllZCBpbiB0aGUgYHNyY2AgYXR0cmlidXRlIG9mIHRoZSBzcGVjaWZpZWQgYGltZ2AgZWxlbWVudCBvciBhcnJheSBvZiBgaW1nYFxuICAgICAqIGVsZW1lbnRzLiBSZXR1cm5zIGEgUHJvbWlzZSBvYmplY3Qgd2hpY2ggcmVzb2x2ZXMgaWYgYWxsIHBhc3NlZCBpbiBgaW1nYCBlbGVtZW50cyBoYXZlIGVpdGhlciBiZWVuXG4gICAgICogaW5qZWN0ZWQgb3IgZmFpbGVkIHRvIGluamVjdCAoT25seSBpZiBhIGdsb2JhbCBQcm9taXNlIG9iamVjdCBpcyBhdmFpbGFibGUgbGlrZSBpbiBhbGwgbW9kZXJuIGJyb3dzZXJzXG4gICAgICogb3IgdGhyb3VnaCBhIHBvbHlmaWxsKS5cbiAgICAgKlxuICAgICAqIE9wdGlvbnM6XG4gICAgICogdXNlQ2FjaGU6IElmIHNldCB0byBgdHJ1ZWAgdGhlIFNWRyB3aWxsIGJlIGNhY2hlZCB1c2luZyB0aGUgYWJzb2x1dGUgVVJMLiBEZWZhdWx0IHZhbHVlIGlzIGB0cnVlYC5cbiAgICAgKiBjb3B5QXR0cmlidXRlczogSWYgc2V0IHRvIGB0cnVlYCB0aGUgYXR0cmlidXRlcyB3aWxsIGJlIGNvcGllZCBmcm9tIGBpbWdgIHRvIGBzdmdgLiBEZmF1bHQgdmFsdWVcbiAgICAgKiAgICAgaXMgYHRydWVgLlxuICAgICAqIG1ha2VJZHNVbmlxdWU6IElmIHNldCB0byBgdHJ1ZWAgdGhlIElEIG9mIGVsZW1lbnRzIGluIHRoZSBgPGRlZnM+YCBlbGVtZW50IHRoYXQgY2FuIGJlIHJlZmVyZW5jZXMgYnlcbiAgICAgKiAgICAgcHJvcGVydHkgdmFsdWVzIChmb3IgZXhhbXBsZSAnY2xpcFBhdGgnKSBhcmUgbWFkZSB1bmlxdWUgYnkgYXBwZW5kaW5nIFwiLS1pbmplY3QtWFwiLCB3aGVyZSBYIGlzIGFcbiAgICAgKiAgICAgcnVubmluZyBudW1iZXIgd2hpY2ggaW5jcmVhc2VzIHdpdGggZWFjaCBpbmplY3Rpb24uIFRoaXMgaXMgZG9uZSB0byBhdm9pZCBkdXBsaWNhdGUgSURzIGluIHRoZSBET00uXG4gICAgICogYmVmb3JlTG9hZDogSG9vayBiZWZvcmUgU1ZHIGlzIGxvYWRlZC4gVGhlIGBpbWdgIGVsZW1lbnQgaXMgcGFzc2VkIGFzIGEgcGFyYW1ldGVyLiBJZiB0aGUgaG9vayByZXR1cm5zXG4gICAgICogICAgIGEgc3RyaW5nIGl0IGlzIHVzZWQgYXMgdGhlIFVSTCBpbnN0ZWFkIG9mIHRoZSBgaW1nYCBlbGVtZW50J3MgYHNyY2AgYXR0cmlidXRlLlxuICAgICAqIGFmdGVyTG9hZDogSG9vayBhZnRlciBTVkcgaXMgbG9hZGVkLiBUaGUgbG9hZGVkIGBzdmdgIGVsZW1lbnQgYW5kIGBzdmdgIHN0cmluZyBhcmUgcGFzc2VkIGFzIGFcbiAgICAgKiAgICAgcGFyYW1ldGVycy4gSWYgY2FjaGluZyBpcyBhY3RpdmUgdGhpcyBob29rIHdpbGwgb25seSBnZXQgY2FsbGVkIG9uY2UgZm9yIGluamVjdGVkIFNWR3Mgd2l0aCB0aGVcbiAgICAgKiAgICAgc2FtZSBhYnNvbHV0ZSBwYXRoLiBDaGFuZ2VzIHRvIHRoZSBgc3ZnYCBlbGVtZW50IGluIHRoaXMgaG9vayB3aWxsIGJlIGFwcGxpZWQgdG8gYWxsIGluamVjdGVkIFNWR3NcbiAgICAgKiAgICAgd2l0aCB0aGUgc2FtZSBhYnNvbHV0ZSBwYXRoLiBJdCdzIGFsc28gcG9zc2libGUgdG8gcmV0dXJuIGFuIGBzdmdgIHN0cmluZyBvciBgc3ZnYCBlbGVtZW50IHdoaWNoXG4gICAgICogICAgIHdpbGwgdGhlbiBiZSB1c2VkIGZvciB0aGUgaW5qZWN0aW9uLlxuICAgICAqIGJlZm9yZUluamVjdDogSG9vayBiZWZvcmUgU1ZHIGlzIGluamVjdGVkLiBUaGUgYGltZ2AgYW5kIGBzdmdgIGVsZW1lbnRzIGFyZSBwYXNzZWQgYXMgcGFyYW1ldGVycy4gSWZcbiAgICAgKiAgICAgYW55IGh0bWwgZWxlbWVudCBpcyByZXR1cm5lZCBpdCBnZXRzIGluamVjdGVkIGluc3RlYWQgb2YgYXBwbHlpbmcgdGhlIGRlZmF1bHQgU1ZHIGluamVjdGlvbi5cbiAgICAgKiBhZnRlckluamVjdDogSG9vayBhZnRlciBTVkcgaXMgaW5qZWN0ZWQuIFRoZSBgaW1nYCBhbmQgYHN2Z2AgZWxlbWVudHMgYXJlIHBhc3NlZCBhcyBwYXJhbWV0ZXJzLlxuICAgICAqIG9uQWxsRmluaXNoOiBIb29rIGFmdGVyIGFsbCBgaW1nYCBlbGVtZW50cyBwYXNzZWQgdG8gYW4gU1ZHSW5qZWN0KCkgY2FsbCBoYXZlIGVpdGhlciBiZWVuIGluamVjdGVkIG9yXG4gICAgICogICAgIGZhaWxlZCB0byBpbmplY3QuXG4gICAgICogb25GYWlsOiBIb29rIGFmdGVyIGluamVjdGlvbiBmYWlscy4gVGhlIGBpbWdgIGVsZW1lbnQgYW5kIGEgYHN0YXR1c2Agc3RyaW5nIGFyZSBwYXNzZWQgYXMgYW4gcGFyYW1ldGVyLlxuICAgICAqICAgICBUaGUgYHN0YXR1c2AgY2FuIGJlIGVpdGhlciBgJ1NWR19OT1RfU1VQUE9SVEVEJ2AgKHRoZSBicm93c2VyIGRvZXMgbm90IHN1cHBvcnQgU1ZHKSxcbiAgICAgKiAgICAgYCdTVkdfSU5WQUxJRCdgICh0aGUgU1ZHIGlzIG5vdCBpbiBhIHZhbGlkIGZvcm1hdCkgb3IgYCdMT0FEX0ZBSUxFRCdgIChsb2FkaW5nIG9mIHRoZSBTVkcgZmFpbGVkKS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7SFRNTEltYWdlRWxlbWVudH0gaW1nIC0gYW4gaW1nIGVsZW1lbnQgb3IgYW4gYXJyYXkgb2YgaW1nIGVsZW1lbnRzXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAtIG9wdGlvbmFsIHBhcmFtZXRlciB3aXRoIFtvcHRpb25zXSgjb3B0aW9ucykgZm9yIHRoaXMgaW5qZWN0aW9uLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIFNWR0luamVjdChpbWcsIG9wdGlvbnMpIHtcbiAgICAgIG9wdGlvbnMgPSBtZXJnZU9wdGlvbnMoZGVmYXVsdE9wdGlvbnMsIG9wdGlvbnMpO1xuXG4gICAgICB2YXIgcnVuID0gZnVuY3Rpb24ocmVzb2x2ZSkge1xuICAgICAgICB2YXIgYWxsRmluaXNoID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIG9uQWxsRmluaXNoID0gb3B0aW9ucy5vbkFsbEZpbmlzaDtcbiAgICAgICAgICBpZiAob25BbGxGaW5pc2gpIHtcbiAgICAgICAgICAgIG9uQWxsRmluaXNoKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJlc29sdmUgJiYgcmVzb2x2ZSgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChpbWcgJiYgdHlwZW9mIGltZ1tfTEVOR1RIX10gIT0gX1VOREVGSU5FRF8pIHtcbiAgICAgICAgICAvLyBhbiBhcnJheSBsaWtlIHN0cnVjdHVyZSBvZiBpbWcgZWxlbWVudHNcbiAgICAgICAgICB2YXIgaW5qZWN0SW5kZXggPSAwO1xuICAgICAgICAgIHZhciBpbmplY3RDb3VudCA9IGltZ1tfTEVOR1RIX107XG5cbiAgICAgICAgICBpZiAoaW5qZWN0Q291bnQgPT0gMCkge1xuICAgICAgICAgICAgYWxsRmluaXNoKCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBmaW5pc2ggPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgaWYgKCsraW5qZWN0SW5kZXggPT0gaW5qZWN0Q291bnQpIHtcbiAgICAgICAgICAgICAgICBhbGxGaW5pc2goKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBpbmplY3RDb3VudDsgaSsrKSB7XG4gICAgICAgICAgICAgIFNWR0luamVjdEVsZW1lbnQoaW1nW2ldLCBvcHRpb25zLCBmaW5pc2gpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBvbmx5IG9uZSBpbWcgZWxlbWVudFxuICAgICAgICAgIFNWR0luamVjdEVsZW1lbnQoaW1nLCBvcHRpb25zLCBhbGxGaW5pc2gpO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICAvLyByZXR1cm4gYSBQcm9taXNlIG9iamVjdCBpZiBnbG9iYWxseSBhdmFpbGFibGVcbiAgICAgIHJldHVybiB0eXBlb2YgUHJvbWlzZSA9PSBfVU5ERUZJTkVEXyA/IHJ1bigpIDogbmV3IFByb21pc2UocnVuKTtcbiAgICB9XG5cblxuICAgIC8vIEluamVjdHMgYSBzaW5nbGUgc3ZnIGVsZW1lbnQuIE9wdGlvbnMgbXVzdCBiZSBhbHJlYWR5IG1lcmdlZCB3aXRoIHRoZSBkZWZhdWx0IG9wdGlvbnMuXG4gICAgZnVuY3Rpb24gU1ZHSW5qZWN0RWxlbWVudChpbWdFbGVtLCBvcHRpb25zLCBjYWxsYmFjaykge1xuICAgICAgaWYgKGltZ0VsZW0pIHtcbiAgICAgICAgdmFyIHN2Z0luamVjdEF0dHJpYnV0ZVZhbHVlID0gaW1nRWxlbVtfX1NWR0lOSkVDVF07XG4gICAgICAgIGlmICghc3ZnSW5qZWN0QXR0cmlidXRlVmFsdWUpIHtcbiAgICAgICAgICByZW1vdmVFdmVudExpc3RlbmVycyhpbWdFbGVtKTtcblxuICAgICAgICAgIGlmICghSVNfU1ZHX1NVUFBPUlRFRCkge1xuICAgICAgICAgICAgc3ZnTm90U3VwcG9ydGVkKGltZ0VsZW0sIG9wdGlvbnMpO1xuICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gSW52b2tlIGJlZm9yZUxvYWQgaG9vayBpZiBzZXQuIElmIHRoZSBiZWZvcmVMb2FkIHJldHVybnMgYSB2YWx1ZSB1c2UgaXQgYXMgdGhlIHNyYyBmb3IgdGhlIGxvYWRcbiAgICAgICAgICAvLyBVUkwgcGF0aC4gRWxzZSB1c2UgdGhlIGltZ0VsZW0ncyBzcmMgYXR0cmlidXRlIHZhbHVlLlxuICAgICAgICAgIHZhciBiZWZvcmVMb2FkID0gb3B0aW9ucy5iZWZvcmVMb2FkO1xuICAgICAgICAgIHZhciBzcmMgPSAoYmVmb3JlTG9hZCAmJiBiZWZvcmVMb2FkKGltZ0VsZW0pKSB8fCBpbWdFbGVtW19HRVRfQVRUUklCVVRFX10oJ3NyYycpO1xuXG4gICAgICAgICAgaWYgKCFzcmMpIHtcbiAgICAgICAgICAgIC8vIElmIG5vIGltYWdlIHNyYyBhdHRyaWJ1dGUgaXMgc2V0IGRvIG5vIGluamVjdGlvbi4gVGhpcyBjYW4gb25seSBiZSByZWFjaGVkIGJ5IHVzaW5nIGphdmFzY3JpcHRcbiAgICAgICAgICAgIC8vIGJlY2F1c2UgaWYgbm8gc3JjIGF0dHJpYnV0ZSBpcyBzZXQgdGhlIG9ubG9hZCBhbmQgb25lcnJvciBldmVudHMgZG8gbm90IGdldCBjYWxsZWRcbiAgICAgICAgICAgIGlmIChzcmMgPT09ICcnKSB7XG4gICAgICAgICAgICAgIGxvYWRGYWlsKGltZ0VsZW0sIG9wdGlvbnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBzZXQgYXJyYXkgc28gbGF0ZXIgY2FsbHMgY2FuIHJlZ2lzdGVyIGNhbGxiYWNrc1xuICAgICAgICAgIHZhciBvbkZpbmlzaENhbGxiYWNrcyA9IFtdO1xuICAgICAgICAgIGltZ0VsZW1bX19TVkdJTkpFQ1RdID0gb25GaW5pc2hDYWxsYmFja3M7XG5cbiAgICAgICAgICB2YXIgb25GaW5pc2ggPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICBvbkZpbmlzaENhbGxiYWNrcy5mb3JFYWNoKGZ1bmN0aW9uKG9uRmluaXNoQ2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgb25GaW5pc2hDYWxsYmFjaygpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIHZhciBhYnNVcmwgPSBnZXRBYnNvbHV0ZVVybChzcmMpO1xuICAgICAgICAgIHZhciB1c2VDYWNoZU9wdGlvbiA9IG9wdGlvbnMudXNlQ2FjaGU7XG4gICAgICAgICAgdmFyIG1ha2VJZHNVbmlxdWVPcHRpb24gPSBvcHRpb25zLm1ha2VJZHNVbmlxdWU7XG4gICAgICAgICAgXG4gICAgICAgICAgdmFyIHNldFN2Z0xvYWRDYWNoZVZhbHVlID0gZnVuY3Rpb24odmFsKSB7XG4gICAgICAgICAgICBpZiAodXNlQ2FjaGVPcHRpb24pIHtcbiAgICAgICAgICAgICAgc3ZnTG9hZENhY2hlW2Fic1VybF0uZm9yRWFjaChmdW5jdGlvbihzdmdMb2FkKSB7XG4gICAgICAgICAgICAgICAgc3ZnTG9hZCh2YWwpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgc3ZnTG9hZENhY2hlW2Fic1VybF0gPSB2YWw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIGlmICh1c2VDYWNoZU9wdGlvbikge1xuICAgICAgICAgICAgdmFyIHN2Z0xvYWQgPSBzdmdMb2FkQ2FjaGVbYWJzVXJsXTtcblxuICAgICAgICAgICAgdmFyIGhhbmRsZUxvYWRWYWx1ZSA9IGZ1bmN0aW9uKGxvYWRWYWx1ZSkge1xuICAgICAgICAgICAgICBpZiAobG9hZFZhbHVlID09PSBMT0FEX0ZBSUwpIHtcbiAgICAgICAgICAgICAgICBsb2FkRmFpbChpbWdFbGVtLCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgfSBlbHNlIGlmIChsb2FkVmFsdWUgPT09IFNWR19JTlZBTElEKSB7XG4gICAgICAgICAgICAgICAgc3ZnSW52YWxpZChpbWdFbGVtLCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgaGFzVW5pcXVlSWRzID0gbG9hZFZhbHVlWzBdO1xuICAgICAgICAgICAgICAgIHZhciBzdmdTdHJpbmcgPSBsb2FkVmFsdWVbMV07XG4gICAgICAgICAgICAgICAgdmFyIHVuaXF1ZUlkc1N2Z1N0cmluZyA9IGxvYWRWYWx1ZVsyXTtcbiAgICAgICAgICAgICAgICB2YXIgc3ZnRWxlbTtcblxuICAgICAgICAgICAgICAgIGlmIChtYWtlSWRzVW5pcXVlT3B0aW9uKSB7XG4gICAgICAgICAgICAgICAgICBpZiAoaGFzVW5pcXVlSWRzID09PSBOVUxMKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIElEcyBmb3IgdGhlIFNWRyBzdHJpbmcgaGF2ZSBub3QgYmVlbiBtYWRlIHVuaXF1ZSBiZWZvcmUuIFRoaXMgbWF5IGhhcHBlbiBpZiBwcmV2aW91c1xuICAgICAgICAgICAgICAgICAgICAvLyBpbmplY3Rpb24gb2YgYSBjYWNoZWQgU1ZHIGhhdmUgYmVlbiBydW4gd2l0aCB0aGUgb3B0aW9uIG1ha2VkSWRzVW5pcXVlIHNldCB0byBmYWxzZVxuICAgICAgICAgICAgICAgICAgICBzdmdFbGVtID0gYnVpbGRTdmdFbGVtZW50KHN2Z1N0cmluZywgZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICBoYXNVbmlxdWVJZHMgPSBtYWtlSWRzVW5pcXVlKHN2Z0VsZW0sIGZhbHNlKTtcblxuICAgICAgICAgICAgICAgICAgICBsb2FkVmFsdWVbMF0gPSBoYXNVbmlxdWVJZHM7XG4gICAgICAgICAgICAgICAgICAgIGxvYWRWYWx1ZVsyXSA9IGhhc1VuaXF1ZUlkcyAmJiBzdmdFbGVtVG9TdmdTdHJpbmcoc3ZnRWxlbSk7XG4gICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGhhc1VuaXF1ZUlkcykge1xuICAgICAgICAgICAgICAgICAgICAvLyBNYWtlIElEcyB1bmlxdWUgZm9yIGFscmVhZHkgY2FjaGVkIFNWR3Mgd2l0aCBiZXR0ZXIgcGVyZm9ybWFuY2VcbiAgICAgICAgICAgICAgICAgICAgc3ZnU3RyaW5nID0gbWFrZUlkc1VuaXF1ZUNhY2hlZCh1bmlxdWVJZHNTdmdTdHJpbmcpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHN2Z0VsZW0gPSBzdmdFbGVtIHx8IGJ1aWxkU3ZnRWxlbWVudChzdmdTdHJpbmcsIGZhbHNlKTtcblxuICAgICAgICAgICAgICAgIGluamVjdChpbWdFbGVtLCBzdmdFbGVtLCBhYnNVcmwsIG9wdGlvbnMpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIG9uRmluaXNoKCk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHN2Z0xvYWQgIT0gX1VOREVGSU5FRF8pIHtcbiAgICAgICAgICAgICAgLy8gVmFsdWUgZm9yIHVybCBleGlzdHMgaW4gY2FjaGVcbiAgICAgICAgICAgICAgaWYgKHN2Z0xvYWQuaXNDYWxsYmFja1F1ZXVlKSB7XG4gICAgICAgICAgICAgICAgLy8gU2FtZSB1cmwgaGFzIGJlZW4gY2FjaGVkLCBidXQgdmFsdWUgaGFzIG5vdCBiZWVuIGxvYWRlZCB5ZXQsIHNvIGFkZCB0byBjYWxsYmFja3NcbiAgICAgICAgICAgICAgICBzdmdMb2FkLnB1c2goaGFuZGxlTG9hZFZhbHVlKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBoYW5kbGVMb2FkVmFsdWUoc3ZnTG9hZCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdmFyIHN2Z0xvYWQgPSBbXTtcbiAgICAgICAgICAgICAgLy8gc2V0IHByb3BlcnR5IGlzQ2FsbGJhY2tRdWV1ZSB0byBBcnJheSB0byBkaWZmZXJlbnRpYXRlIGZyb20gYXJyYXkgd2l0aCBjYWNoZWQgbG9hZGVkIHZhbHVlc1xuICAgICAgICAgICAgICBzdmdMb2FkLmlzQ2FsbGJhY2tRdWV1ZSA9IHRydWU7XG4gICAgICAgICAgICAgIHN2Z0xvYWRDYWNoZVthYnNVcmxdID0gc3ZnTG9hZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBMb2FkIHRoZSBTVkcgYmVjYXVzZSBpdCBpcyBub3QgY2FjaGVkIG9yIGNhY2hpbmcgaXMgZGlzYWJsZWRcbiAgICAgICAgICBsb2FkU3ZnKGFic1VybCwgZnVuY3Rpb24oc3ZnWG1sLCBzdmdTdHJpbmcpIHtcbiAgICAgICAgICAgIC8vIFVzZSB0aGUgWE1MIGZyb20gdGhlIFhIUiByZXF1ZXN0IGlmIGl0IGlzIGFuIGluc3RhbmNlIG9mIERvY3VtZW50LiBPdGhlcndpc2VcbiAgICAgICAgICAgIC8vIChmb3IgZXhhbXBsZSBvZiBJRTkpLCBjcmVhdGUgdGhlIHN2ZyBkb2N1bWVudCBmcm9tIHRoZSBzdmcgc3RyaW5nLlxuICAgICAgICAgICAgdmFyIHN2Z0VsZW0gPSBzdmdYbWwgaW5zdGFuY2VvZiBEb2N1bWVudCA/IHN2Z1htbC5kb2N1bWVudEVsZW1lbnQgOiBidWlsZFN2Z0VsZW1lbnQoc3ZnU3RyaW5nLCB0cnVlKTtcblxuICAgICAgICAgICAgdmFyIGFmdGVyTG9hZCA9IG9wdGlvbnMuYWZ0ZXJMb2FkO1xuICAgICAgICAgICAgaWYgKGFmdGVyTG9hZCkge1xuICAgICAgICAgICAgICAvLyBJbnZva2UgYWZ0ZXJMb2FkIGhvb2sgd2hpY2ggbWF5IG1vZGlmeSB0aGUgU1ZHIGVsZW1lbnQuIEFmdGVyIGxvYWQgbWF5IGFsc28gcmV0dXJuIGEgbmV3XG4gICAgICAgICAgICAgIC8vIHN2ZyBlbGVtZW50IG9yIHN2ZyBzdHJpbmdcbiAgICAgICAgICAgICAgdmFyIHN2Z0VsZW1PclN2Z1N0cmluZyA9IGFmdGVyTG9hZChzdmdFbGVtLCBzdmdTdHJpbmcpIHx8IHN2Z0VsZW07XG4gICAgICAgICAgICAgIGlmIChzdmdFbGVtT3JTdmdTdHJpbmcpIHtcbiAgICAgICAgICAgICAgICAvLyBVcGRhdGUgc3ZnRWxlbSBhbmQgc3ZnU3RyaW5nIGJlY2F1c2Ugb2YgbW9kaWZpY2F0aW9ucyB0byB0aGUgU1ZHIGVsZW1lbnQgb3IgU1ZHIHN0cmluZyBpblxuICAgICAgICAgICAgICAgIC8vIHRoZSBhZnRlckxvYWQgaG9vaywgc28gdGhlIG1vZGlmaWVkIFNWRyBpcyBhbHNvIHVzZWQgZm9yIGFsbCBsYXRlciBjYWNoZWQgaW5qZWN0aW9uc1xuICAgICAgICAgICAgICAgIHZhciBpc1N0cmluZyA9IHR5cGVvZiBzdmdFbGVtT3JTdmdTdHJpbmcgPT0gJ3N0cmluZyc7XG4gICAgICAgICAgICAgICAgc3ZnU3RyaW5nID0gaXNTdHJpbmcgPyBzdmdFbGVtT3JTdmdTdHJpbmcgOiBzdmdFbGVtVG9TdmdTdHJpbmcoc3ZnRWxlbSk7XG4gICAgICAgICAgICAgICAgc3ZnRWxlbSA9IGlzU3RyaW5nID8gYnVpbGRTdmdFbGVtZW50KHN2Z0VsZW1PclN2Z1N0cmluZywgdHJ1ZSkgOiBzdmdFbGVtT3JTdmdTdHJpbmc7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHN2Z0VsZW0gaW5zdGFuY2VvZiBTVkdFbGVtZW50KSB7XG4gICAgICAgICAgICAgIHZhciBoYXNVbmlxdWVJZHMgPSBOVUxMO1xuICAgICAgICAgICAgICBpZiAobWFrZUlkc1VuaXF1ZU9wdGlvbikge1xuICAgICAgICAgICAgICAgIGhhc1VuaXF1ZUlkcyA9IG1ha2VJZHNVbmlxdWUoc3ZnRWxlbSwgZmFsc2UpO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgaWYgKHVzZUNhY2hlT3B0aW9uKSB7XG4gICAgICAgICAgICAgICAgdmFyIHVuaXF1ZUlkc1N2Z1N0cmluZyA9IGhhc1VuaXF1ZUlkcyAmJiBzdmdFbGVtVG9TdmdTdHJpbmcoc3ZnRWxlbSk7XG4gICAgICAgICAgICAgICAgLy8gc2V0IGFuIGFycmF5IHdpdGggdGhyZWUgZW50cmllcyB0byB0aGUgbG9hZCBjYWNoZVxuICAgICAgICAgICAgICAgIHNldFN2Z0xvYWRDYWNoZVZhbHVlKFtoYXNVbmlxdWVJZHMsIHN2Z1N0cmluZywgdW5pcXVlSWRzU3ZnU3RyaW5nXSk7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBpbmplY3QoaW1nRWxlbSwgc3ZnRWxlbSwgYWJzVXJsLCBvcHRpb25zKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHN2Z0ludmFsaWQoaW1nRWxlbSwgb3B0aW9ucyk7XG4gICAgICAgICAgICAgIHNldFN2Z0xvYWRDYWNoZVZhbHVlKFNWR19JTlZBTElEKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG9uRmluaXNoKCk7XG4gICAgICAgICAgfSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBsb2FkRmFpbChpbWdFbGVtLCBvcHRpb25zKTtcbiAgICAgICAgICAgIHNldFN2Z0xvYWRDYWNoZVZhbHVlKExPQURfRkFJTCk7XG4gICAgICAgICAgICBvbkZpbmlzaCgpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHN2Z0luamVjdEF0dHJpYnV0ZVZhbHVlKSkge1xuICAgICAgICAgICAgLy8gc3ZnSW5qZWN0QXR0cmlidXRlVmFsdWUgaXMgYW4gYXJyYXkuIEluamVjdGlvbiBpcyBub3QgY29tcGxldGUgc28gcmVnaXN0ZXIgY2FsbGJhY2tcbiAgICAgICAgICAgIHN2Z0luamVjdEF0dHJpYnV0ZVZhbHVlLnB1c2goY2FsbGJhY2spO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaW1nTm90U2V0KCk7XG4gICAgICB9XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAgKiBTZXRzIHRoZSBkZWZhdWx0IFtvcHRpb25zXSgjb3B0aW9ucykgZm9yIFNWR0luamVjdC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gLSBkZWZhdWx0IFtvcHRpb25zXSgjb3B0aW9ucykgZm9yIGFuIGluamVjdGlvbi5cbiAgICAgKi9cbiAgICBTVkdJbmplY3Quc2V0T3B0aW9ucyA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgIGRlZmF1bHRPcHRpb25zID0gbWVyZ2VPcHRpb25zKGRlZmF1bHRPcHRpb25zLCBvcHRpb25zKTtcbiAgICB9O1xuXG5cbiAgICAvLyBDcmVhdGUgYSBuZXcgaW5zdGFuY2Ugb2YgU1ZHSW5qZWN0XG4gICAgU1ZHSW5qZWN0LmNyZWF0ZSA9IGNyZWF0ZVNWR0luamVjdDtcblxuXG4gICAgLyoqXG4gICAgICogVXNlZCBpbiBvbmVycm9yIEV2ZW50IG9mIGFuIGA8aW1nPmAgZWxlbWVudCB0byBoYW5kbGUgY2FzZXMgd2hlbiB0aGUgbG9hZGluZyB0aGUgb3JpZ2luYWwgc3JjIGZhaWxzXG4gICAgICogKGZvciBleGFtcGxlIGlmIGZpbGUgaXMgbm90IGZvdW5kIG9yIGlmIHRoZSBicm93c2VyIGRvZXMgbm90IHN1cHBvcnQgU1ZHKS4gVGhpcyB0cmlnZ2VycyBhIGNhbGwgdG8gdGhlXG4gICAgICogb3B0aW9ucyBvbkZhaWwgaG9vayBpZiBhdmFpbGFibGUuIFRoZSBvcHRpb25hbCBzZWNvbmQgcGFyYW1ldGVyIHdpbGwgYmUgc2V0IGFzIHRoZSBuZXcgc3JjIGF0dHJpYnV0ZVxuICAgICAqIGZvciB0aGUgaW1nIGVsZW1lbnQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0hUTUxJbWFnZUVsZW1lbnR9IGltZyAtIGFuIGltZyBlbGVtZW50XG4gICAgICogQHBhcmFtIHtTdHJpbmd9IFtmYWxsYmFja1NyY10gLSBvcHRpb25hbCBwYXJhbWV0ZXIgZmFsbGJhY2sgc3JjXG4gICAgICovXG4gICAgU1ZHSW5qZWN0LmVyciA9IGZ1bmN0aW9uKGltZywgZmFsbGJhY2tTcmMpIHtcbiAgICAgIGlmIChpbWcpIHtcbiAgICAgICAgaWYgKGltZ1tfX1NWR0lOSkVDVF0gIT0gRkFJTCkge1xuICAgICAgICAgIHJlbW92ZUV2ZW50TGlzdGVuZXJzKGltZyk7XG5cbiAgICAgICAgICBpZiAoIUlTX1NWR19TVVBQT1JURUQpIHtcbiAgICAgICAgICAgIHN2Z05vdFN1cHBvcnRlZChpbWcsIGRlZmF1bHRPcHRpb25zKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVtb3ZlT25Mb2FkQXR0cmlidXRlKGltZyk7XG4gICAgICAgICAgICBsb2FkRmFpbChpbWcsIGRlZmF1bHRPcHRpb25zKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGZhbGxiYWNrU3JjKSB7XG4gICAgICAgICAgICByZW1vdmVPbkxvYWRBdHRyaWJ1dGUoaW1nKTtcbiAgICAgICAgICAgIGltZy5zcmMgPSBmYWxsYmFja1NyYztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGltZ05vdFNldCgpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICB3aW5kb3dbZ2xvYmFsTmFtZV0gPSBTVkdJbmplY3Q7XG5cbiAgICByZXR1cm4gU1ZHSW5qZWN0O1xuICB9XG5cbiAgdmFyIFNWR0luamVjdEluc3RhbmNlID0gY3JlYXRlU1ZHSW5qZWN0KCdTVkdJbmplY3QnKTtcblxuICBpZiAodHlwZW9mIG1vZHVsZSA9PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgPT0gJ29iamVjdCcpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IFNWR0luamVjdEluc3RhbmNlO1xuICB9XG59KSh3aW5kb3csIGRvY3VtZW50KTsiLCJpbXBvcnQgdmlzaWJpbGl0eV9vbiBmcm9tICcuLi8uLi9hc3NldHMvaWNvbnMvdmlzaWJpbGl0eV9vbi5zdmcnO1xuXG5leHBvcnQgY29uc3QgaW5wdXRzID0ge1xuICBlbWFpbDoge1xuICAgIGVsZW1lbnQ6ICdpbnB1dCcsXG4gICAgdGV4dENvbnRlbnQ6ICdlbWFpbCcsXG4gICAgYXR0cmlidXRlczoge1xuICAgICAgaWQ6ICdlbWFpbCcsXG4gICAgICBjbGFzczogJ2Zvcm1faW5wdXQnLFxuICAgICAgbmFtZTogJ2VtYWlsJyxcbiAgICAgIHR5cGU6ICdlbWFpbCcsXG4gICAgICBwbGFjZWhvbGRlcjogJ2VtYWlsQGFkZHJlc3MuY29tJyxcbiAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgIH0sXG4gICAgZXJyb3I6ICdFbnRlciBhIHZhbGlkIGVtYWlsIGFkZHJlc3MgKGUuZy4sIHlvdXJfZW1haWxAeHl6LmNvbSkuJyxcbiAgfSxcbiAgY291bnRyeToge1xuICAgIGVsZW1lbnQ6ICdzZWxlY3QnLFxuICAgIHRleHRDb250ZW50OiAnY291bnRyeScsXG4gICAgYXR0cmlidXRlczoge1xuICAgICAgaWQ6ICdjb3VudHJ5JyxcbiAgICAgIGNsYXNzOiAnZm9ybV9pbnB1dCcsXG4gICAgICBuYW1lOiAnY291bnRyeScsXG4gICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICB9LFxuICAgIGNoaWxkcmVuOiB7XG4gICAgICBlbGVtZW50OiAnb3B0aW9uJyxcbiAgICAgIGNvdW50cmllczogW1xuICAgICAgICB7ICcnOiAnICcgfSxcbiAgICAgICAgeyBjaDogJ1N3aXR6ZXJsYW5kJyB9LFxuICAgICAgICB7IGdiOiAnVW5pdGVkIEtpbmdkb20nIH0sXG4gICAgICAgIHsgdXM6ICdVbml0ZWQgU3RhdGVzJyB9LFxuICAgICAgICB7IGNhOiAnQ2FuYWRhJyB9LFxuICAgICAgXSxcbiAgICB9LFxuICAgIGVycm9yOiAnU2VsZWN0IGEgY291bnRyeS4nLFxuICB9LFxuICB6aXBjb2RlOiB7XG4gICAgZWxlbWVudDogJ2lucHV0JyxcbiAgICB0ZXh0Q29udGVudDogJ3ppcCBjb2RlJyxcbiAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICBpZDogJ3ppcGNvZGUnLFxuICAgICAgY2xhc3M6ICdmb3JtX2lucHV0JyxcbiAgICAgIG5hbWU6ICd6aXBjb2RlJyxcbiAgICAgIHR5cGU6ICd0ZXh0JyxcbiAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgIH0sXG4gICAgLy8gZXJyb3I6ICdTZWxlY3QgYSBjb3VudHJ5IGFuZCBlbnRlciBhIHZhbGlkIHppcCBjb2RlIGNvcnJlc3BvbmRpbmcgdG8gdGhlIHNlbGVjdGVkIGNvdW50cnkuJyxcbiAgfSxcbiAgcGFzc3dvcmQ6IHtcbiAgICBlbGVtZW50OiAnaW5wdXQnLFxuICAgIHRleHRDb250ZW50OiAncGFzc3dvcmQnLFxuICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgIGlkOiAncGFzc3dvcmQnLFxuICAgICAgY2xhc3M6ICdmb3JtX2lucHV0JyxcbiAgICAgIG5hbWU6ICdwYXNzd29yZCcsXG4gICAgICB0eXBlOiAncGFzc3dvcmQnLFxuICAgICAgcGxhY2Vob2xkZXI6ICdFbnRlciBwYXNzd29yZCcsXG4gICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICAgIHBhdHRlcm46ICcoPz0uKlswLTldKSg/PS4qW2Etel0pKD89LipbQS1aXSkoPz0uKlxcXFxXKSg/IS4qICkuezgsMzB9JyxcbiAgICB9LFxuICAgIHNpYmxpbmc6IHtcbiAgICAgIGVsZW1lbnQ6ICdidXR0b24nLFxuICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICBjbGFzczogJ2J0bl92aXNpYmlsaXR5JyxcbiAgICAgICAgdHlwZTogJ2J1dHRvbicsXG4gICAgICB9LFxuICAgICAgY2hpbGQ6IHtcbiAgICAgICAgZWxlbWVudDogJ2ltZycsXG4gICAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgICBjbGFzczogJ3Zpc2liaWxpdHknLFxuICAgICAgICAgIHNyYzogdmlzaWJpbGl0eV9vbixcbiAgICAgICAgICBvbmxvYWQ6ICdTVkdJbmplY3QodGhpcyknLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuICAgIGVycm9yOlxuICAgICAgJ1Bhc3N3b3JkIG11c3QgYmUgYXQgbGVhc3QgOCBjaGFyYWN0ZXJzIGxvbmcsIGNhbiBiZSB1cCB0byAzMCBjaGFyYWN0ZXJzIGxvbmcsIGFuZCBtdXN0IGNvbnRhaW4gMSBvZiBlYWNoIG9mIHRoZSBmb2xsb3dpbmc6IHVwcGVyY2FzZSBsZXR0ZXIsIGxvd2VyY2FzZSBsZXR0ZXIsIG51bWJlciwgYW5kIHNwZWNpYWwgY2hhcmFjdGVyOyBubyBzcGFjZXMgYWxsb3dlZC4nLFxuICB9LFxuICBwYXNzd29yZENvbmZpcm1hdGlvbjoge1xuICAgIGVsZW1lbnQ6ICdpbnB1dCcsXG4gICAgdGV4dENvbnRlbnQ6ICdjb25maXJtIHBhc3N3b3JkJyxcbiAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICBpZDogJ3Bhc3N3b3JkX2NvbmZpcm0nLFxuICAgICAgY2xhc3M6ICdmb3JtX2lucHV0JyxcbiAgICAgIG5hbWU6ICdwYXNzd29yZF9jb25maXJtJyxcbiAgICAgIHR5cGU6ICdwYXNzd29yZCcsXG4gICAgICBwbGFjZWhvbGRlcjogJ1JlZW50ZXIgcGFzc3dvcmQnLFxuICAgICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgfSxcbiAgICBzaWJsaW5nOiB7XG4gICAgICBlbGVtZW50OiAnYnV0dG9uJyxcbiAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgY2xhc3M6ICdidG5fdmlzaWJpbGl0eScsXG4gICAgICAgIHR5cGU6ICdidXR0b24nLFxuICAgICAgfSxcbiAgICAgIGNoaWxkOiB7XG4gICAgICAgIGVsZW1lbnQ6ICdpbWcnLFxuICAgICAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICAgICAgY2xhc3M6ICd2aXNpYmlsaXR5JyxcbiAgICAgICAgICBzcmM6IHZpc2liaWxpdHlfb24sXG4gICAgICAgICAgb25sb2FkOiAnU1ZHSW5qZWN0KHRoaXMpJyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBlcnJvcjogJ1Bhc3N3b3JkcyBkbyBub3QgbWF0Y2guJyxcbiAgfSxcbn07XG5cbmV4cG9ydCBjb25zdCBmb3JtQnV0dG9ucyA9IHtcbiAgY2FuY2VsOiB7XG4gICAgZWxlbWVudDogJ2J1dHRvbicsXG4gICAgYXR0cmlidXRlczoge1xuICAgICAgY2xhc3M6ICdidG5fY2FuY2VsJyxcbiAgICAgIHR5cGU6ICdidXR0b24nLFxuICAgIH0sXG4gIH0sXG4gIHN1Ym1pdDoge1xuICAgIGVsZW1lbnQ6ICdidXR0b24nLFxuICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgIGNsYXNzOiAnYnRuX3N1Ym1pdCcsXG4gICAgICB0eXBlOiAnc3VibWl0JyxcbiAgICB9LFxuICB9LFxufTtcbiIsImltcG9ydCB7IGlucHV0cywgZm9ybUJ1dHRvbnMgfSBmcm9tICcuL2Zvcm0uY29uZmlnJztcbmltcG9ydCBjcmVhdGVFbGVtZW50IGZyb20gJy4uLy4uL3V0aWxpdGllcy9jcmVhdGVFbGVtZW50JztcbmltcG9ydCAnLi9mb3JtLmNzcyc7XG5pbXBvcnQgdmlzaWJpbGl0eV9vbiBmcm9tICcuLi8uLi9hc3NldHMvaWNvbnMvdmlzaWJpbGl0eV9vbi5zdmcnO1xuaW1wb3J0IHZpc2liaWxpdHlfb2ZmIGZyb20gJy4uLy4uL2Fzc2V0cy9pY29ucy92aXNpYmlsaXR5X29mZi5zdmcnO1xuXG5leHBvcnQgZGVmYXVsdCAoc3RhdGUpID0+ICh7XG4gIHR5cGU6IHN0YXRlLnR5cGUsXG4gIGNhY2hlRE9NKGNvbnRhaW5lcikge1xuICAgIHRoaXMuZm9ybSA9IGNvbnRhaW5lcjtcbiAgICB0aGlzLmlucHV0cyA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKCcuZm9ybV9pdGVtIGlucHV0LCAuZm9ybV9pdGVtIHNlbGVjdCcpO1xuICAgIHRoaXMuYnRuQ2FuY2VsID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJy5idG5fY2FuY2VsJyk7XG4gICAgdGhpcy52YWxpZGl0eUVycm9ycyA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKCcudmFsaWRpdHlfZXJyb3InKTtcbiAgICB0aGlzLmJ0blN1Ym1pdCA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcuYnRuX3N1Ym1pdCcpO1xuICAgIHRoaXMuYnRuc1Zpc2liaWxpdHkgPSBjb250YWluZXIucXVlcnlTZWxlY3RvckFsbCgnLmJ0bl92aXNpYmlsaXR5Jyk7XG4gIH0sXG4gIGJpbmRFdmVudHMoKSB7XG4gICAgdGhpcy5zdWJtaXRGb3JtID0gdGhpcy5zdWJtaXRGb3JtLmJpbmQodGhpcyk7XG4gICAgdGhpcy5yZXNldEZvcm0gPSB0aGlzLnJlc2V0Rm9ybS5iaW5kKHRoaXMpO1xuICAgIHRoaXMudG9nZ2xlUGFzc3dvcmQgPSB0aGlzLnRvZ2dsZVBhc3N3b3JkLmJpbmQodGhpcyk7XG4gICAgdGhpcy5mb3JtLmFkZEV2ZW50TGlzdGVuZXIoJ3N1Ym1pdCcsIHRoaXMuc3VibWl0Rm9ybSk7XG4gICAgdGhpcy5idG5DYW5jZWwuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLnJlc2V0Rm9ybSk7XG4gICAgdGhpcy5idG5zVmlzaWJpbGl0eS5mb3JFYWNoKChidG4pID0+IGJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMudG9nZ2xlUGFzc3dvcmQpKTtcblxuICAgIC8vIGluIGZvcm1fdmFsaWRhdGlvbl9jb250cm9sbGVyLmpzXG4gICAgdGhpcy52YWxpZGF0ZUlucHV0ID0gdGhpcy52YWxpZGF0ZUlucHV0LmJpbmQodGhpcyk7XG4gICAgdGhpcy5pbnB1dHMuZm9yRWFjaCgoaW5wdXQpID0+IHRoaXMuYmluZElucHV0KGlucHV0LCAnYmx1cicpKTtcbiAgfSxcbiAgYmluZElucHV0KGlucHV0LCBldmVudFR5cGUpIHtcbiAgICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKGV2ZW50VHlwZSwgdGhpcy52YWxpZGF0ZUlucHV0KTtcbiAgfSxcbiAgcmVuZGVyKCkge1xuICAgIGNvbnN0IGZvcm1FbGVtZW50ID0gY3JlYXRlRWxlbWVudCgnZm9ybScpO1xuICAgIGNvbnN0IGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGZvcm1FbGVtZW50LnNldEF0dHJpYnV0ZXMoeyBpZDogJ2Zvcm0nLCBub3ZhbGlkYXRlOiB0cnVlIH0pO1xuICAgIGNvbnRhaW5lci5jbGFzc0xpc3QuYWRkKCdjb250YWluZXInKTtcblxuICAgIE9iamVjdC5rZXlzKGlucHV0cykuZm9yRWFjaCgoaW5wdXQpID0+IHtcbiAgICAgIGNvbnN0IGZvcm1JdGVtID0gY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICBjb25zdCBmb3JtTGFiZWwgPSBjcmVhdGVFbGVtZW50KCdsYWJlbCcpO1xuICAgICAgY29uc3QgZm9ybUVycm9yID0gY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgY29uc3QgaW5wdXRXcmFwcGVyID0gY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICBjb25zdCBmb3JtSW5wdXQgPSBjcmVhdGVFbGVtZW50KGlucHV0c1tpbnB1dF0uZWxlbWVudCk7XG5cbiAgICAgIGZvcm1JdGVtLnNldEF0dHJpYnV0ZXMoeyBjbGFzczogJ2Zvcm1faXRlbScgfSk7XG4gICAgICBmb3JtSW5wdXQuc2V0QXR0cmlidXRlcyhpbnB1dHNbaW5wdXRdLmF0dHJpYnV0ZXMpO1xuICAgICAgaW5wdXRXcmFwcGVyLnNldEF0dHJpYnV0ZXMoeyBjbGFzczogJ2lucHV0X3dyYXBwZXInIH0pO1xuICAgICAgZm9ybUxhYmVsLnNldEF0dHJpYnV0ZXMoeyBmb3I6IGlucHV0c1tpbnB1dF0uYXR0cmlidXRlcy5pZCB9KTtcbiAgICAgIGZvcm1MYWJlbC50ZXh0Q29udGVudCA9IGlucHV0c1tpbnB1dF0udGV4dENvbnRlbnQ7XG4gICAgICBmb3JtRXJyb3Iuc2V0QXR0cmlidXRlcyh7XG4gICAgICAgIGNsYXNzOiBgdmFsaWRpdHlfZXJyb3IgJHtpbnB1dHNbaW5wdXRdLmF0dHJpYnV0ZXMuaWR9YCxcbiAgICAgICAgJ2FyaWEtbGl2ZSc6ICdwb2xpdGUnLFxuICAgICAgfSk7XG4gICAgICBmb3JtRXJyb3IudGV4dENvbnRlbnQgPSBpbnB1dHNbaW5wdXRdLmVycm9yO1xuXG4gICAgICBpbnB1dFdyYXBwZXIuYXBwZW5kQ2hpbGQoZm9ybUlucHV0KTtcblxuICAgICAgaWYgKGlucHV0c1tpbnB1dF0uY2hpbGRyZW4pIHtcbiAgICAgICAgLy8gbmVlZCB0byBzZXQgb3B0aW9uIHZhbHVlIEFORCB0ZXh0Q29udGVudFxuICAgICAgICAvLyBmb3IgZXhhbXBsZSwgdmFsdWU9J2NoJyBhbmQgdGV4dENvbnRlbnQgd2lsbCBiZSBTd2l0emVybGFuZFxuICAgICAgICBjb25zdCB7IGNoaWxkcmVuOiBvcHRpb25zIH0gPSBpbnB1dHNbaW5wdXRdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG9wdGlvbnMuY291bnRyaWVzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgY29uc3Qgb3B0aW9uID0gY3JlYXRlRWxlbWVudChvcHRpb25zLmVsZW1lbnQpO1xuXG4gICAgICAgICAgT2JqZWN0LmVudHJpZXMob3B0aW9ucy5jb3VudHJpZXNbaV0pLmZvckVhY2goKFtrZXksIHZhbHVlXSkgPT4ge1xuICAgICAgICAgICAgb3B0aW9uLnZhbHVlID0ga2V5O1xuICAgICAgICAgICAgb3B0aW9uLnRleHRDb250ZW50ID0gdmFsdWU7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgZm9ybUlucHV0LmFwcGVuZENoaWxkKG9wdGlvbik7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoaW5wdXRzW2lucHV0XS5zaWJsaW5nKSB7XG4gICAgICAgIGNvbnN0IGJ0blZpc2liaWxpdHkgPSBjcmVhdGVFbGVtZW50KGlucHV0c1tpbnB1dF0uc2libGluZy5lbGVtZW50KTtcbiAgICAgICAgY29uc3QgdmlzaWJpbGl0eUljb24gPSBjcmVhdGVFbGVtZW50KGlucHV0c1tpbnB1dF0uc2libGluZy5jaGlsZC5lbGVtZW50KTtcbiAgICAgICAgYnRuVmlzaWJpbGl0eS5zZXRBdHRyaWJ1dGVzKGlucHV0c1tpbnB1dF0uc2libGluZy5hdHRyaWJ1dGVzKTtcbiAgICAgICAgdmlzaWJpbGl0eUljb24uc2V0QXR0cmlidXRlcyhpbnB1dHNbaW5wdXRdLnNpYmxpbmcuY2hpbGQuYXR0cmlidXRlcyk7XG5cbiAgICAgICAgYnRuVmlzaWJpbGl0eS5hcHBlbmRDaGlsZCh2aXNpYmlsaXR5SWNvbik7XG4gICAgICAgIGlucHV0V3JhcHBlci5hcHBlbmRDaGlsZChidG5WaXNpYmlsaXR5KTtcbiAgICAgIH1cblxuICAgICAgZm9ybUl0ZW0uYXBwZW5kQ2hpbGQoZm9ybUxhYmVsKTtcbiAgICAgIGZvcm1JdGVtLmFwcGVuZENoaWxkKGlucHV0V3JhcHBlcik7XG4gICAgICBmb3JtSXRlbS5hcHBlbmRDaGlsZChmb3JtRXJyb3IpO1xuICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGZvcm1JdGVtKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IGZvcm1CdXR0b25zQ29udGFpbmVyID0gY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgZm9ybUJ1dHRvbnNDb250YWluZXIuc2V0QXR0cmlidXRlcyh7IGNsYXNzOiAnZm9ybV9idXR0b25zJyB9KTtcblxuICAgIE9iamVjdC5rZXlzKGZvcm1CdXR0b25zKS5mb3JFYWNoKChidG4pID0+IHtcbiAgICAgIGNvbnN0IGZvcm1CdXR0b24gPSBjcmVhdGVFbGVtZW50KGZvcm1CdXR0b25zW2J0bl0uZWxlbWVudCk7XG4gICAgICBmb3JtQnV0dG9uLnNldEF0dHJpYnV0ZXMoZm9ybUJ1dHRvbnNbYnRuXS5hdHRyaWJ1dGVzKTtcbiAgICAgIGZvcm1CdXR0b24udGV4dENvbnRlbnQgPSBidG47XG4gICAgICBmb3JtQnV0dG9uc0NvbnRhaW5lci5hcHBlbmRDaGlsZChmb3JtQnV0dG9uKTtcbiAgICB9KTtcblxuICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChmb3JtQnV0dG9uc0NvbnRhaW5lcik7XG4gICAgZm9ybUVsZW1lbnQuYXBwZW5kQ2hpbGQoY29udGFpbmVyKTtcblxuICAgIHRoaXMuY2FjaGVET00oZm9ybUVsZW1lbnQpO1xuICAgIHRoaXMuYmluZEV2ZW50cygpO1xuICAgIHJldHVybiBmb3JtRWxlbWVudDtcbiAgfSxcbiAgdG9nZ2xlUGFzc3dvcmQoZSkge1xuICAgIGNvbnN0IGlucHV0ID0gZS5jdXJyZW50VGFyZ2V0LnByZXZpb3VzU2libGluZztcbiAgICBjb25zdCBpY29uID0gZS5jdXJyZW50VGFyZ2V0LmZpcnN0Q2hpbGQ7XG4gICAgY29uc3QgbmV3SWNvbiA9IGNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xuICAgIG5ld0ljb24uc2V0QXR0cmlidXRlcyh7XG4gICAgICBjbGFzczogaWNvbi5jbGFzc0xpc3QsXG4gICAgICBzcmM6IGljb24uZGF0YXNldC5pbmplY3RVcmwgPT09IHZpc2liaWxpdHlfb24gPyB2aXNpYmlsaXR5X29mZiA6IHZpc2liaWxpdHlfb24sXG4gICAgICBvbmxvYWQ6ICdTVkdJbmplY3QodGhpcyknLFxuICAgIH0pO1xuXG4gICAgaW5wdXQudHlwZSAhPT0gJ3RleHQnID8gKGlucHV0LnR5cGUgPSAndGV4dCcpIDogKGlucHV0LnR5cGUgPSAncGFzc3dvcmQnKTtcbiAgICBpY29uLnJlcGxhY2VXaXRoKG5ld0ljb24pO1xuICB9LFxufSk7XG4iLCJpbXBvcnQgemlwY29kZXMgZnJvbSAnLi96aXBjb2Rlcyc7XG5cbmV4cG9ydCBkZWZhdWx0ICgpID0+ICh7XG4gIHJlc2V0Rm9ybSgpIHtcbiAgICB0aGlzLmlucHV0cy5mb3JFYWNoKChpbnB1dCkgPT4ge1xuICAgICAgaW5wdXQudmFsdWUgPSAnJztcbiAgICAgIGlucHV0LmNsYXNzTGlzdC5yZW1vdmUoJ2lucHV0X2Vycm9yJyk7XG4gICAgfSk7XG5cbiAgICB0aGlzLnZhbGlkaXR5RXJyb3JzLmZvckVhY2goKGVycm9yKSA9PiB7XG4gICAgICBlcnJvci5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIH0pO1xuICB9LFxuICBzdWJtaXRGb3JtKGUpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgdGhpcy5pbnB1dHMuZm9yRWFjaCgoaW5wdXQpID0+IHRoaXMudmFsaWRhdGVJbnB1dChpbnB1dCkpO1xuICAgIGlmIChbLi4udGhpcy5pbnB1dHNdLmV2ZXJ5KChpbnB1dCkgPT4gdGhpcy52YWxpZGF0ZUlucHV0KGlucHV0KSkpIHtcbiAgICAgIHRoaXMucmVzZXRGb3JtKCk7XG4gICAgfVxuICB9LFxuICB2YWxpZGF0ZUlucHV0KGUpIHtcbiAgICBjb25zb2xlLmxvZyhlKTtcbiAgICBjb25zdCBpbnB1dCA9IGUuY3VycmVudFRhcmdldCA/IGUuY3VycmVudFRhcmdldCA6IGU7XG4gICAgY29uc3QgZXJyb3IgPSBbLi4udGhpcy52YWxpZGl0eUVycm9yc10uZmluZCgodmFsaWRpdHlFcnJvcikgPT5cbiAgICAgIHZhbGlkaXR5RXJyb3IuY2xhc3NMaXN0LmNvbnRhaW5zKGlucHV0LmlkKSxcbiAgICApO1xuXG4gICAgaWYgKGlucHV0LmlkID09PSAncGFzc3dvcmRfY29uZmlybScpIHtcbiAgICAgIGlucHV0LnBhdHRlcm4gPSBbLi4udGhpcy5pbnB1dHNdLmZpbmQoKGtleSkgPT4ga2V5LnR5cGUgPT09IGlucHV0LnR5cGUpLnZhbHVlO1xuICAgIH0gZWxzZSBpZiAoaW5wdXQuaWQgPT09ICd6aXBjb2RlJykge1xuICAgICAgY29uc3QgaW5wdXRDb3VudHJ5ID0gWy4uLnRoaXMuaW5wdXRzXS5maW5kKChrZXkpID0+IGtleS5pZCA9PT0gJ2NvdW50cnknKTtcbiAgICAgIGNvbnN0IHppcENvdW50cnkgPSBPYmplY3QudmFsdWVzKHppcGNvZGVzKS5maW5kKFxuICAgICAgICAoY291bnRyeSkgPT4gY291bnRyeS5pc28gPT09IGlucHV0Q291bnRyeS52YWx1ZSxcbiAgICAgICk7XG5cbiAgICAgIGlmICh6aXBDb3VudHJ5KSB7XG4gICAgICAgIGlucHV0LnBhdHRlcm4gPSB6aXBDb3VudHJ5LnJlZ2V4O1xuICAgICAgICBlcnJvci50ZXh0Q29udGVudCA9IHppcENvdW50cnkuZXJyb3I7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgdmFsaWRpdHkgPSBpbnB1dC5jaGVja1ZhbGlkaXR5KCk7XG4gICAgY29uc3QgeyB0eXBlIH0gPSBlO1xuXG4gICAgaWYgKCF2YWxpZGl0eSkge1xuICAgICAgaWYgKHR5cGUgPT09ICdibHVyJyAmJiAhaW5wdXQuY2xhc3NMaXN0LmNvbnRhaW5zKCdpbnB1dF9lcnJvcicpKSB7XG4gICAgICAgIC8vIHZhbGlkaXR5IGNoZWNrIGlzIGFnZ3Jlc3NpdmVcbiAgICAgICAgY29uc29sZS5sb2coJ3ZhbGlkaXR5IGlzIGZhbHNlIEFORCB0eXBlIGlzIGJsdXInKTtcbiAgICAgICAgdGhpcy5iaW5kSW5wdXQoaW5wdXQsICdpbnB1dCcpO1xuICAgICAgfSBlbHNlIGlmICh0eXBlID09PSAnaW5wdXQnKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCd2YWxpZGl0eSBpcyBmYWxzZSBBTkQgdHlwZSBpcyBpbnB1dCcpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5sb2coJ3ZhbGlkaXR5IGlzIGZhbHNlIGFuZCBlbHNlIHJ1bm5pbmcnKTtcbiAgICAgIH1cbiAgICAgIC8vIGVycm9yLnN0eWxlLnZpc2liaWxpdHkgPSAndmlzaWJsZSc7XG4gICAgICBlcnJvci5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICAgIGlucHV0LmNsYXNzTGlzdC5hZGQoJ2lucHV0X2Vycm9yJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGVycm9yLnN0eWxlLnZpc2liaWxpdHkgPSAnaGlkZGVuJztcbiAgICAgIGVycm9yLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICBpbnB1dC5jbGFzc0xpc3QucmVtb3ZlKCdpbnB1dF9lcnJvcicpO1xuICAgICAgaW5wdXQucmVtb3ZlRXZlbnRMaXN0ZW5lcignaW5wdXQnLCB0aGlzLnZhbGlkYXRlSW5wdXQpO1xuICAgIH1cblxuICAgIHJldHVybiB2YWxpZGl0eTtcbiAgfSxcbn0pO1xuIiwiaW1wb3J0IGZvcm0gZnJvbSAnLi9mb3JtJztcbmltcG9ydCBmb3JtVmFsaWRhdGlvbkNvbnRyb2xsZXIgZnJvbSAnLi9mb3JtX3ZhbGlkYXRpb25fY29udHJvbGxlcic7XG5cbmNvbnN0IGluaXRGb3JtID0gKHR5cGUpID0+IHtcbiAgY29uc3Qgc3RhdGUgPSB7XG4gICAgdHlwZSxcbiAgfTtcblxuICByZXR1cm4ge1xuICAgIC4uLmZvcm0oc3RhdGUpLFxuICAgIC4uLmZvcm1WYWxpZGF0aW9uQ29udHJvbGxlcihzdGF0ZSksXG4gIH07XG59O1xuXG5leHBvcnQgZGVmYXVsdCB7XG4gIHNlY3Rpb25zOiBbXSxcbiAgYWRkKHR5cGUpIHtcbiAgICB0aGlzLnNlY3Rpb25zID0gWy4uLnRoaXMuc2VjdGlvbnMsIGluaXRGb3JtKHR5cGUpXTtcbiAgICByZXR1cm4gdGhpcy5maW5kKHR5cGUpO1xuICB9LFxuICByZW1vdmUodHlwZSkge1xuICAgIHRoaXMuc2VjdGlvbnMuc3BsaWNlKHRoaXMuc2VjdGlvbnMuaW5kZXhPZih0aGlzLmZpbmQodHlwZSkpLCAxKTtcbiAgfSxcbiAgZmluZCh0eXBlKSB7XG4gICAgcmV0dXJuIHRoaXMuc2VjdGlvbnMuZmluZCgoc2VjdGlvbikgPT4gc2VjdGlvbi50eXBlID09PSB0eXBlKTtcbiAgfSxcbn07XG4iLCJleHBvcnQgZGVmYXVsdCBbXG4gIHtcbiAgICAvLyBmYWxsYmFjayBlcnJvciBtZXNzYWdlIHdoZW4gbm8gY291bnRyeSBpcyBzZWxlY3RlZFxuICAgIGlzbzogJycsXG4gICAgcmVnZXg6ICcnLFxuICAgIGVycm9yOiAnU2VsZWN0IGEgY291bnRyeSBhbmQgZW50ZXIgYSB2YWxpZCB6aXAgY29kZSBjb3JyZXNwb25kaW5nIHRvIHRoZSBzZWxlY3RlZCBjb3VudHJ5LicsXG4gIH0sXG4gIHtcbiAgICBjb3VudHJ5OiAnc3dpenRlcmxhbmQnLFxuICAgIGlzbzogJ2NoJyxcbiAgICByZWdleDogJyhDSC0pP1xcXFxkezR9JyxcbiAgICBlcnJvcjogJ1N3aXR6ZXJsYW5kIHppcCBjb2RlcyBtdXN0IGJlIGJldHdlZW4gNC03IGNoYXJhY3RlcnMgbG9uZyAoZS5nLiwgXCJDSC0xOTUwXCIgb3IgXCIxOTUwXCIpLicsXG4gIH0sXG4gIHtcbiAgICBjb3VudHJ5OiAndW5pdGVkIGtpbmdkb20nLFxuICAgIGlzbzogJ2diJyxcbiAgICByZWdleDogJ1tBLVpdezEsMn1bMC05XVtBLVowLTldPyA/WzAtOV1bQS1aXXsyfScsXG4gICAgZXJyb3I6XG4gICAgICAnVW5pdGVkIEtpbmdkb20gemlwIGNvZGVzIG11c3QgYmUgYmV0d2VlbiA2LTggY2hhcmFjdGVycyBsb25nIChlLmcuLCBcIlNXMVcgME5ZXCIgb3IgXCJMMSA4SlFcIikuJyxcbiAgfSxcbiAge1xuICAgIGNvdW50cnk6ICd1bml0ZWQgc3RhdGVzJyxcbiAgICBpc286ICd1cycsXG4gICAgcmVnZXg6ICdcXFxcYihcXFxcZCl7NX0oKFsgXFxcXC1dKT9cXFxcZHs0fSk/JyxcbiAgICBlcnJvcjpcbiAgICAgICdVbml0ZWQgU3RhdGVzIHppcCBjb2RlcyBtdXN0IGJlIGJldHdlZW4gNS0xMCBjaGFyYWN0ZXJzIGxvbmcgbWFkZSB1cCB3aXRoIG9ubHkgZGlnaXRzIGFuZCBhIHNpbmdsZSBzcGFjZS9oeXBoZW4gKGUuZy4sIFwiMTIzNDVcIiBvciBcIjEyMzQ1LTY3ODlcIikuJyxcbiAgfSxcbiAge1xuICAgIGNvdW50cnk6ICdjYW5hZGEnLFxuICAgIGlzbzogJ2NhJyxcbiAgICByZWdleDogJyhbQS1aXVxcXFxkW0EtWl0pIChcXFxcZFtBLVpdXFxcXGQpJyxcbiAgICBlcnJvcjogJ0NhbmFkYSB6aXAgY29kZXMgbXVzdCBiZSA3IGNoYXJhY3RlcnMgbG9uZyAoZS5nLiwgXCJDMEEgMUEwXCIpLicsXG4gIH0sXG5dO1xuIiwiLy8gRGVsZXRlIG9yIHJlbmFtZSBhcyBuZWVkZWRcbmltcG9ydCAnLi9pbmRleC5jc3MnO1xuaW1wb3J0IGluaXRGb3JtIGZyb20gJy4vY29tcG9uZW50cy9mb3JtL2luaXRfZm9ybSc7XG5pbXBvcnQgU1ZHSW5qZWN0IGZyb20gJ0BpY29uZnUvc3ZnLWluamVjdCc7XG5cbi8vIGNvbnN0IHN0YXRpY0Zvcm0gPSBidWlsZEZvcm0uYWRkKCdzdGF0aWMnKTtcbi8vIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoc3RhdGljRm9ybS5yZW5kZXIoKSk7XG5kb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGluaXRGb3JtLmFkZCgnc3RhdGljJykucmVuZGVyKCkpO1xuIiwiLy8gY3JlYXRlcyBhbiBlbGVtZW50XG4vLyByZXR1cm4gZWxlbWVudCB3aXRoIHNldEF0dHJpYnV0ZXMgbWV0aG9kXG5jb25zdCBzZXRFbGVtZW50U3RhdGUgPSAoKSA9PiAoe1xuICBzZXRBdHRyaWJ1dGVzKGF0dHJpYnV0ZXMpIHtcbiAgICBPYmplY3QuZW50cmllcyhhdHRyaWJ1dGVzKS5mb3JFYWNoKChba2V5LCB2YWx1ZV0pID0+IHtcbiAgICAgIHRoaXMuc2V0QXR0cmlidXRlKGtleSwgdmFsdWUpO1xuICAgIH0pO1xuICB9LFxufSk7XG5cbmNvbnN0IEJ1aWxkRWxlbWVudCA9IChlbGVtZW50KSA9PiB7XG4gIGNvbnN0IHN0YXRlID0ge1xuICAgIGVsZW1lbnQsXG4gIH07XG5cbiAgcmV0dXJuIHtcbiAgICAuLi5zZXRFbGVtZW50U3RhdGUoc3RhdGUpLFxuICB9O1xufTtcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY3JlYXRlRWxlbWVudChlbGVtZW50KSB7XG4gIGNvbnN0IGh0bWxFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChlbGVtZW50KTtcbiAgT2JqZWN0LmFzc2lnbihodG1sRWxlbWVudCwgQnVpbGRFbGVtZW50KGh0bWxFbGVtZW50KSk7XG5cbiAgcmV0dXJuIGh0bWxFbGVtZW50O1xufVxuIiwiLy8gSW1wb3J0c1xuaW1wb3J0IF9fX0NTU19MT0FERVJfQVBJX1NPVVJDRU1BUF9JTVBPUlRfX18gZnJvbSBcIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2Rpc3QvcnVudGltZS9zb3VyY2VNYXBzLmpzXCI7XG5pbXBvcnQgX19fQ1NTX0xPQURFUl9BUElfSU1QT1JUX19fIGZyb20gXCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9kaXN0L3J1bnRpbWUvYXBpLmpzXCI7XG52YXIgX19fQ1NTX0xPQURFUl9FWFBPUlRfX18gPSBfX19DU1NfTE9BREVSX0FQSV9JTVBPUlRfX18oX19fQ1NTX0xPQURFUl9BUElfU09VUkNFTUFQX0lNUE9SVF9fXyk7XG4vLyBNb2R1bGVcbl9fX0NTU19MT0FERVJfRVhQT1JUX19fLnB1c2goW21vZHVsZS5pZCwgYCNmb3JtIHtcbiAgd2lkdGg6IDUwMHB4O1xuICBtYXJnaW46IGF1dG87XG59XG5cbiNmb3JtID4gLmNvbnRhaW5lciB7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gIHJvdy1nYXA6IDFyZW07XG4gIHBhZGRpbmc6IDFyZW07XG59XG5cbiNmb3JtID4gLmNvbnRhaW5lciA+IC5mb3JtX2l0ZW0ge1xuICBkaXNwbGF5OiBmbGV4O1xuICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICByb3ctZ2FwOiAwLjI1cmVtO1xufVxuXG4jZm9ybSA+IC5jb250YWluZXIgPiAuZm9ybV9pdGVtID4gbGFiZWw6OmZpcnN0LWxldHRlciB7XG4gIHRleHQtdHJhbnNmb3JtOiB1cHBlcmNhc2U7XG59XG5cbiNmb3JtID4gLmNvbnRhaW5lciA+IC5mb3JtX2l0ZW0gPiAuaW5wdXRfd3JhcHBlciB7XG4gIGRpc3BsYXk6IGZsZXg7XG59XG5cbiNmb3JtID4gLmNvbnRhaW5lciA+IC5mb3JtX2l0ZW0gPiAuaW5wdXRfd3JhcHBlciA+IC5mb3JtX2lucHV0IHtcbiAgZmxleDogMSBhdXRvO1xuICBwYWRkaW5nOiAwLjVyZW07XG4gIGJvcmRlci1yYWRpdXM6IDAuMjVyZW07XG4gIGJvcmRlcjogbm9uZTtcbn1cblxuI2Zvcm0gPiAuY29udGFpbmVyID4gLmZvcm1faXRlbSA+IC5pbnB1dF93cmFwcGVyID4gLmZvcm1faW5wdXQ6dmFsaWQge1xuICBib3JkZXI6IDJweCBzb2xpZCBncmVlbjtcbn1cblxuI2Zvcm0gPiAuY29udGFpbmVyID4gLmZvcm1faXRlbSA+IC5pbnB1dF93cmFwcGVyID4gLmZvcm1faW5wdXQ6Zm9jdXMge1xuICBib3JkZXItY29sb3I6IGJsYWNrO1xuICBib3JkZXItd2lkdGg6IDZweDtcbiAgcGFkZGluZzogMC43NXJlbTtcbiAgb3V0bGluZTogbm9uZTtcbn1cblxuI2Zvcm0gPiAuY29udGFpbmVyID4gLmZvcm1faXRlbSA+IGxhYmVsW2Zvcj0ncGFzc3dvcmQnXSArIC5pbnB1dF93cmFwcGVyLFxuI2Zvcm0gPiAuY29udGFpbmVyID4gLmZvcm1faXRlbSA+IGxhYmVsW2Zvcj0ncGFzc3dvcmRfY29uZmlybSddICsgLmlucHV0X3dyYXBwZXIge1xuICBkaXNwbGF5OiBmbGV4O1xuICBwb3NpdGlvbjogcmVsYXRpdmU7XG59XG5cbiNmb3JtID4gLmNvbnRhaW5lciA+IC5mb3JtX2l0ZW0gPiBsYWJlbFtmb3I9J3Bhc3N3b3JkJ10gKyAuaW5wdXRfd3JhcHBlciA+IC5idG5fdmlzaWJpbGl0eSxcbiNmb3JtID4gLmNvbnRhaW5lciA+IC5mb3JtX2l0ZW0gPiBsYWJlbFtmb3I9J3Bhc3N3b3JkX2NvbmZpcm0nXSArIC5pbnB1dF93cmFwcGVyID4gLmJ0bl92aXNpYmlsaXR5IHtcbiAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XG4gIGJvcmRlcjogbm9uZTtcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICByaWdodDogMTJweDtcbiAgYWxpZ24tc2VsZjogY2VudGVyO1xuICBkaXNwbGF5OiBmbGV4O1xufVxuXG4jZm9ybSA+IC5jb250YWluZXIgPiAuZm9ybV9pdGVtID4gbGFiZWxbZm9yPSdwYXNzd29yZCddICsgLmlucHV0X3dyYXBwZXIgPiAuYnRuX3Zpc2liaWxpdHk6aG92ZXIsXG4jZm9ybVxuICA+IC5jb250YWluZXJcbiAgPiAuZm9ybV9pdGVtXG4gID4gbGFiZWxbZm9yPSdwYXNzd29yZF9jb25maXJtJ11cbiAgKyAuaW5wdXRfd3JhcHBlclxuICA+IC5idG5fdmlzaWJpbGl0eTpob3ZlciB7XG4gIGN1cnNvcjogcG9pbnRlcjtcbn1cblxuI2Zvcm0gPiAuY29udGFpbmVyID4gLmZvcm1faXRlbSA+IC5pbnB1dF93cmFwcGVyID4gLmlucHV0X2Vycm9yIHtcbiAgYm9yZGVyOiAzcHggc29saWQgcmdiKDI1NSwgMCwgMCk7XG59XG5cbiNmb3JtID4gLmNvbnRhaW5lciA+IC5mb3JtX2l0ZW0gPiAudmFsaWRpdHlfZXJyb3Ige1xuICBkaXNwbGF5OiBub25lO1xuICBjb2xvcjogcmdiKDI1NSwgMCwgMCk7XG59XG5cbiNmb3JtID4gLmNvbnRhaW5lciA+IC5mb3JtX2J1dHRvbnMge1xuICBkaXNwbGF5OiBmbGV4O1xuICBqdXN0aWZ5LWNvbnRlbnQ6IGVuZDtcbiAgY29sdW1uLWdhcDogMC41cmVtO1xufVxuXG4jZm9ybSA+IC5jb250YWluZXIgPiAuZm9ybV9idXR0b25zID4gYnV0dG9uIHtcbiAgcGFkZGluZzogMC41cmVtIDFyZW07XG4gIGJvcmRlci1yYWRpdXM6IDAuMjVyZW07XG4gIGJvcmRlcjogbm9uZTtcbiAgYm94LXNoYWRvdzogMCAycHggM3B4IC0ycHggYmxhY2s7XG4gIHRleHQtdHJhbnNmb3JtOiBjYXBpdGFsaXplO1xufVxuXG4jZm9ybSA+IC5jb250YWluZXIgPiAuZm9ybV9idXR0b25zID4gYnV0dG9uOmhvdmVyIHtcbiAgY3Vyc29yOiBwb2ludGVyO1xufVxuXG4jZm9ybSA+IC5jb250YWluZXIgPiAuZm9ybV9idXR0b25zID4gYnV0dG9uOmFjdGl2ZSB7XG4gIGJveC1zaGFkb3c6IDAgNXB4IDVweCAtMnB4IGJsYWNrO1xufVxuYCwgXCJcIix7XCJ2ZXJzaW9uXCI6MyxcInNvdXJjZXNcIjpbXCJ3ZWJwYWNrOi8vLi9zcmMvY29tcG9uZW50cy9mb3JtL2Zvcm0uY3NzXCJdLFwibmFtZXNcIjpbXSxcIm1hcHBpbmdzXCI6XCJBQUFBO0VBQ0UsWUFBWTtFQUNaLFlBQVk7QUFDZDs7QUFFQTtFQUNFLGFBQWE7RUFDYixzQkFBc0I7RUFDdEIsYUFBYTtFQUNiLGFBQWE7QUFDZjs7QUFFQTtFQUNFLGFBQWE7RUFDYixzQkFBc0I7RUFDdEIsZ0JBQWdCO0FBQ2xCOztBQUVBO0VBQ0UseUJBQXlCO0FBQzNCOztBQUVBO0VBQ0UsYUFBYTtBQUNmOztBQUVBO0VBQ0UsWUFBWTtFQUNaLGVBQWU7RUFDZixzQkFBc0I7RUFDdEIsWUFBWTtBQUNkOztBQUVBO0VBQ0UsdUJBQXVCO0FBQ3pCOztBQUVBO0VBQ0UsbUJBQW1CO0VBQ25CLGlCQUFpQjtFQUNqQixnQkFBZ0I7RUFDaEIsYUFBYTtBQUNmOztBQUVBOztFQUVFLGFBQWE7RUFDYixrQkFBa0I7QUFDcEI7O0FBRUE7O0VBRUUsdUJBQXVCO0VBQ3ZCLFlBQVk7RUFDWixrQkFBa0I7RUFDbEIsV0FBVztFQUNYLGtCQUFrQjtFQUNsQixhQUFhO0FBQ2Y7O0FBRUE7Ozs7Ozs7RUFPRSxlQUFlO0FBQ2pCOztBQUVBO0VBQ0UsZ0NBQWdDO0FBQ2xDOztBQUVBO0VBQ0UsYUFBYTtFQUNiLHFCQUFxQjtBQUN2Qjs7QUFFQTtFQUNFLGFBQWE7RUFDYixvQkFBb0I7RUFDcEIsa0JBQWtCO0FBQ3BCOztBQUVBO0VBQ0Usb0JBQW9CO0VBQ3BCLHNCQUFzQjtFQUN0QixZQUFZO0VBQ1osZ0NBQWdDO0VBQ2hDLDBCQUEwQjtBQUM1Qjs7QUFFQTtFQUNFLGVBQWU7QUFDakI7O0FBRUE7RUFDRSxnQ0FBZ0M7QUFDbENcIixcInNvdXJjZXNDb250ZW50XCI6W1wiI2Zvcm0ge1xcbiAgd2lkdGg6IDUwMHB4O1xcbiAgbWFyZ2luOiBhdXRvO1xcbn1cXG5cXG4jZm9ybSA+IC5jb250YWluZXIge1xcbiAgZGlzcGxheTogZmxleDtcXG4gIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XFxuICByb3ctZ2FwOiAxcmVtO1xcbiAgcGFkZGluZzogMXJlbTtcXG59XFxuXFxuI2Zvcm0gPiAuY29udGFpbmVyID4gLmZvcm1faXRlbSB7XFxuICBkaXNwbGF5OiBmbGV4O1xcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcXG4gIHJvdy1nYXA6IDAuMjVyZW07XFxufVxcblxcbiNmb3JtID4gLmNvbnRhaW5lciA+IC5mb3JtX2l0ZW0gPiBsYWJlbDo6Zmlyc3QtbGV0dGVyIHtcXG4gIHRleHQtdHJhbnNmb3JtOiB1cHBlcmNhc2U7XFxufVxcblxcbiNmb3JtID4gLmNvbnRhaW5lciA+IC5mb3JtX2l0ZW0gPiAuaW5wdXRfd3JhcHBlciB7XFxuICBkaXNwbGF5OiBmbGV4O1xcbn1cXG5cXG4jZm9ybSA+IC5jb250YWluZXIgPiAuZm9ybV9pdGVtID4gLmlucHV0X3dyYXBwZXIgPiAuZm9ybV9pbnB1dCB7XFxuICBmbGV4OiAxIGF1dG87XFxuICBwYWRkaW5nOiAwLjVyZW07XFxuICBib3JkZXItcmFkaXVzOiAwLjI1cmVtO1xcbiAgYm9yZGVyOiBub25lO1xcbn1cXG5cXG4jZm9ybSA+IC5jb250YWluZXIgPiAuZm9ybV9pdGVtID4gLmlucHV0X3dyYXBwZXIgPiAuZm9ybV9pbnB1dDp2YWxpZCB7XFxuICBib3JkZXI6IDJweCBzb2xpZCBncmVlbjtcXG59XFxuXFxuI2Zvcm0gPiAuY29udGFpbmVyID4gLmZvcm1faXRlbSA+IC5pbnB1dF93cmFwcGVyID4gLmZvcm1faW5wdXQ6Zm9jdXMge1xcbiAgYm9yZGVyLWNvbG9yOiBibGFjaztcXG4gIGJvcmRlci13aWR0aDogNnB4O1xcbiAgcGFkZGluZzogMC43NXJlbTtcXG4gIG91dGxpbmU6IG5vbmU7XFxufVxcblxcbiNmb3JtID4gLmNvbnRhaW5lciA+IC5mb3JtX2l0ZW0gPiBsYWJlbFtmb3I9J3Bhc3N3b3JkJ10gKyAuaW5wdXRfd3JhcHBlcixcXG4jZm9ybSA+IC5jb250YWluZXIgPiAuZm9ybV9pdGVtID4gbGFiZWxbZm9yPSdwYXNzd29yZF9jb25maXJtJ10gKyAuaW5wdXRfd3JhcHBlciB7XFxuICBkaXNwbGF5OiBmbGV4O1xcbiAgcG9zaXRpb246IHJlbGF0aXZlO1xcbn1cXG5cXG4jZm9ybSA+IC5jb250YWluZXIgPiAuZm9ybV9pdGVtID4gbGFiZWxbZm9yPSdwYXNzd29yZCddICsgLmlucHV0X3dyYXBwZXIgPiAuYnRuX3Zpc2liaWxpdHksXFxuI2Zvcm0gPiAuY29udGFpbmVyID4gLmZvcm1faXRlbSA+IGxhYmVsW2Zvcj0ncGFzc3dvcmRfY29uZmlybSddICsgLmlucHV0X3dyYXBwZXIgPiAuYnRuX3Zpc2liaWxpdHkge1xcbiAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XFxuICBib3JkZXI6IG5vbmU7XFxuICBwb3NpdGlvbjogYWJzb2x1dGU7XFxuICByaWdodDogMTJweDtcXG4gIGFsaWduLXNlbGY6IGNlbnRlcjtcXG4gIGRpc3BsYXk6IGZsZXg7XFxufVxcblxcbiNmb3JtID4gLmNvbnRhaW5lciA+IC5mb3JtX2l0ZW0gPiBsYWJlbFtmb3I9J3Bhc3N3b3JkJ10gKyAuaW5wdXRfd3JhcHBlciA+IC5idG5fdmlzaWJpbGl0eTpob3ZlcixcXG4jZm9ybVxcbiAgPiAuY29udGFpbmVyXFxuICA+IC5mb3JtX2l0ZW1cXG4gID4gbGFiZWxbZm9yPSdwYXNzd29yZF9jb25maXJtJ11cXG4gICsgLmlucHV0X3dyYXBwZXJcXG4gID4gLmJ0bl92aXNpYmlsaXR5OmhvdmVyIHtcXG4gIGN1cnNvcjogcG9pbnRlcjtcXG59XFxuXFxuI2Zvcm0gPiAuY29udGFpbmVyID4gLmZvcm1faXRlbSA+IC5pbnB1dF93cmFwcGVyID4gLmlucHV0X2Vycm9yIHtcXG4gIGJvcmRlcjogM3B4IHNvbGlkIHJnYigyNTUsIDAsIDApO1xcbn1cXG5cXG4jZm9ybSA+IC5jb250YWluZXIgPiAuZm9ybV9pdGVtID4gLnZhbGlkaXR5X2Vycm9yIHtcXG4gIGRpc3BsYXk6IG5vbmU7XFxuICBjb2xvcjogcmdiKDI1NSwgMCwgMCk7XFxufVxcblxcbiNmb3JtID4gLmNvbnRhaW5lciA+IC5mb3JtX2J1dHRvbnMge1xcbiAgZGlzcGxheTogZmxleDtcXG4gIGp1c3RpZnktY29udGVudDogZW5kO1xcbiAgY29sdW1uLWdhcDogMC41cmVtO1xcbn1cXG5cXG4jZm9ybSA+IC5jb250YWluZXIgPiAuZm9ybV9idXR0b25zID4gYnV0dG9uIHtcXG4gIHBhZGRpbmc6IDAuNXJlbSAxcmVtO1xcbiAgYm9yZGVyLXJhZGl1czogMC4yNXJlbTtcXG4gIGJvcmRlcjogbm9uZTtcXG4gIGJveC1zaGFkb3c6IDAgMnB4IDNweCAtMnB4IGJsYWNrO1xcbiAgdGV4dC10cmFuc2Zvcm06IGNhcGl0YWxpemU7XFxufVxcblxcbiNmb3JtID4gLmNvbnRhaW5lciA+IC5mb3JtX2J1dHRvbnMgPiBidXR0b246aG92ZXIge1xcbiAgY3Vyc29yOiBwb2ludGVyO1xcbn1cXG5cXG4jZm9ybSA+IC5jb250YWluZXIgPiAuZm9ybV9idXR0b25zID4gYnV0dG9uOmFjdGl2ZSB7XFxuICBib3gtc2hhZG93OiAwIDVweCA1cHggLTJweCBibGFjaztcXG59XFxuXCJdLFwic291cmNlUm9vdFwiOlwiXCJ9XSk7XG4vLyBFeHBvcnRzXG5leHBvcnQgZGVmYXVsdCBfX19DU1NfTE9BREVSX0VYUE9SVF9fXztcbiIsIi8vIEltcG9ydHNcbmltcG9ydCBfX19DU1NfTE9BREVSX0FQSV9TT1VSQ0VNQVBfSU1QT1JUX19fIGZyb20gXCIuLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9kaXN0L3J1bnRpbWUvc291cmNlTWFwcy5qc1wiO1xuaW1wb3J0IF9fX0NTU19MT0FERVJfQVBJX0lNUE9SVF9fXyBmcm9tIFwiLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvZGlzdC9ydW50aW1lL2FwaS5qc1wiO1xuaW1wb3J0IF9fX0NTU19MT0FERVJfR0VUX1VSTF9JTVBPUlRfX18gZnJvbSBcIi4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2Rpc3QvcnVudGltZS9nZXRVcmwuanNcIjtcbnZhciBfX19DU1NfTE9BREVSX1VSTF9JTVBPUlRfMF9fXyA9IG5ldyBVUkwoXCIuL2Fzc2V0cy9mb250cy9Qb3BwaW5zL1BvcHBpbnMtUmVndWxhci50dGZcIiwgaW1wb3J0Lm1ldGEudXJsKTtcbnZhciBfX19DU1NfTE9BREVSX1VSTF9JTVBPUlRfMV9fXyA9IG5ldyBVUkwoXCIuL2Fzc2V0cy9mb250cy9Qb3BwaW5zL1BvcHBpbnMtU2VtaUJvbGQudHRmXCIsIGltcG9ydC5tZXRhLnVybCk7XG52YXIgX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzJfX18gPSBuZXcgVVJMKFwiLi9hc3NldHMvZm9udHMvUG9wcGlucy9Qb3BwaW5zLVRoaW4udHRmXCIsIGltcG9ydC5tZXRhLnVybCk7XG52YXIgX19fQ1NTX0xPQURFUl9FWFBPUlRfX18gPSBfX19DU1NfTE9BREVSX0FQSV9JTVBPUlRfX18oX19fQ1NTX0xPQURFUl9BUElfU09VUkNFTUFQX0lNUE9SVF9fXyk7XG52YXIgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfMF9fXyA9IF9fX0NTU19MT0FERVJfR0VUX1VSTF9JTVBPUlRfX18oX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzBfX18pO1xudmFyIF9fX0NTU19MT0FERVJfVVJMX1JFUExBQ0VNRU5UXzFfX18gPSBfX19DU1NfTE9BREVSX0dFVF9VUkxfSU1QT1JUX19fKF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF8xX19fKTtcbnZhciBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF8yX19fID0gX19fQ1NTX0xPQURFUl9HRVRfVVJMX0lNUE9SVF9fXyhfX19DU1NfTE9BREVSX1VSTF9JTVBPUlRfMl9fXyk7XG4vLyBNb2R1bGVcbl9fX0NTU19MT0FERVJfRVhQT1JUX19fLnB1c2goW21vZHVsZS5pZCwgYC8qIERlbGV0ZSBvciByZW5hbWUgYXMgbmVlZGVkICovXG5AZm9udC1mYWNlIHtcbiAgZm9udC1mYW1pbHk6ICdQb3BwaW5zJztcbiAgc3JjOiB1cmwoJHtfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF8wX19ffSksXG4gICAgdXJsKCR7X19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfMV9fX30pLFxuICAgIHVybCgke19fX0NTU19MT0FERVJfVVJMX1JFUExBQ0VNRU5UXzJfX199KTtcbiAgICBmb250LXdlaWdodDogbm9ybWFsO1xuICAgIGZvbnQtc3R5bGU6IG5vcm1hbDtcbn1cblxuKiwgKjo6YmVmb3JlLCAqOjphZnRlciB7XG4gIGJveC1zaXppbmc6IGJvcmRlci1ib3g7XG4gIC13ZWJraXQtYm94LXNpemluZzogYm9yZGVyLWJveDtcbiAgLW1vei1ib3gtc2l6aW5nOiBib3JkZXItYm94O1xuICBwYWRkaW5nOiAwO1xuICBtYXJnaW46IDA7XG59XG5cbmJvZHkge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiBsaWdodGJsdWU7XG4gIGZvbnQtZmFtaWx5OiAnUG9wcGlucycsIEFyaWFsLCBzYW5zLXNlcmlmO1xufWAsIFwiXCIse1widmVyc2lvblwiOjMsXCJzb3VyY2VzXCI6W1wid2VicGFjazovLy4vc3JjL2luZGV4LmNzc1wiXSxcIm5hbWVzXCI6W10sXCJtYXBwaW5nc1wiOlwiQUFBQSwrQkFBK0I7QUFDL0I7RUFDRSxzQkFBc0I7RUFDdEI7OzJDQUVnRDtJQUM5QyxtQkFBbUI7SUFDbkIsa0JBQWtCO0FBQ3RCOztBQUVBO0VBQ0Usc0JBQXNCO0VBQ3RCLDhCQUE4QjtFQUM5QiwyQkFBMkI7RUFDM0IsVUFBVTtFQUNWLFNBQVM7QUFDWDs7QUFFQTtFQUNFLDJCQUEyQjtFQUMzQix5Q0FBeUM7QUFDM0NcIixcInNvdXJjZXNDb250ZW50XCI6W1wiLyogRGVsZXRlIG9yIHJlbmFtZSBhcyBuZWVkZWQgKi9cXG5AZm9udC1mYWNlIHtcXG4gIGZvbnQtZmFtaWx5OiAnUG9wcGlucyc7XFxuICBzcmM6IHVybCgnLi9hc3NldHMvZm9udHMvUG9wcGlucy9Qb3BwaW5zLVJlZ3VsYXIudHRmJyksXFxuICAgIHVybCgnLi9hc3NldHMvZm9udHMvUG9wcGlucy9Qb3BwaW5zLVNlbWlCb2xkLnR0ZicpLFxcbiAgICB1cmwoJy4vYXNzZXRzL2ZvbnRzL1BvcHBpbnMvUG9wcGlucy1UaGluLnR0ZicpO1xcbiAgICBmb250LXdlaWdodDogbm9ybWFsO1xcbiAgICBmb250LXN0eWxlOiBub3JtYWw7XFxufVxcblxcbiosICo6OmJlZm9yZSwgKjo6YWZ0ZXIge1xcbiAgYm94LXNpemluZzogYm9yZGVyLWJveDtcXG4gIC13ZWJraXQtYm94LXNpemluZzogYm9yZGVyLWJveDtcXG4gIC1tb3otYm94LXNpemluZzogYm9yZGVyLWJveDtcXG4gIHBhZGRpbmc6IDA7XFxuICBtYXJnaW46IDA7XFxufVxcblxcbmJvZHkge1xcbiAgYmFja2dyb3VuZC1jb2xvcjogbGlnaHRibHVlO1xcbiAgZm9udC1mYW1pbHk6ICdQb3BwaW5zJywgQXJpYWwsIHNhbnMtc2VyaWY7XFxufVwiXSxcInNvdXJjZVJvb3RcIjpcIlwifV0pO1xuLy8gRXhwb3J0c1xuZXhwb3J0IGRlZmF1bHQgX19fQ1NTX0xPQURFUl9FWFBPUlRfX187XG4iLCJcInVzZSBzdHJpY3RcIjtcblxuLypcbiAgTUlUIExpY2Vuc2UgaHR0cDovL3d3dy5vcGVuc291cmNlLm9yZy9saWNlbnNlcy9taXQtbGljZW5zZS5waHBcbiAgQXV0aG9yIFRvYmlhcyBLb3BwZXJzIEBzb2tyYVxuKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGNzc1dpdGhNYXBwaW5nVG9TdHJpbmcpIHtcbiAgdmFyIGxpc3QgPSBbXTtcblxuICAvLyByZXR1cm4gdGhlIGxpc3Qgb2YgbW9kdWxlcyBhcyBjc3Mgc3RyaW5nXG4gIGxpc3QudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZygpIHtcbiAgICByZXR1cm4gdGhpcy5tYXAoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgIHZhciBjb250ZW50ID0gXCJcIjtcbiAgICAgIHZhciBuZWVkTGF5ZXIgPSB0eXBlb2YgaXRlbVs1XSAhPT0gXCJ1bmRlZmluZWRcIjtcbiAgICAgIGlmIChpdGVtWzRdKSB7XG4gICAgICAgIGNvbnRlbnQgKz0gXCJAc3VwcG9ydHMgKFwiLmNvbmNhdChpdGVtWzRdLCBcIikge1wiKTtcbiAgICAgIH1cbiAgICAgIGlmIChpdGVtWzJdKSB7XG4gICAgICAgIGNvbnRlbnQgKz0gXCJAbWVkaWEgXCIuY29uY2F0KGl0ZW1bMl0sIFwiIHtcIik7XG4gICAgICB9XG4gICAgICBpZiAobmVlZExheWVyKSB7XG4gICAgICAgIGNvbnRlbnQgKz0gXCJAbGF5ZXJcIi5jb25jYXQoaXRlbVs1XS5sZW5ndGggPiAwID8gXCIgXCIuY29uY2F0KGl0ZW1bNV0pIDogXCJcIiwgXCIge1wiKTtcbiAgICAgIH1cbiAgICAgIGNvbnRlbnQgKz0gY3NzV2l0aE1hcHBpbmdUb1N0cmluZyhpdGVtKTtcbiAgICAgIGlmIChuZWVkTGF5ZXIpIHtcbiAgICAgICAgY29udGVudCArPSBcIn1cIjtcbiAgICAgIH1cbiAgICAgIGlmIChpdGVtWzJdKSB7XG4gICAgICAgIGNvbnRlbnQgKz0gXCJ9XCI7XG4gICAgICB9XG4gICAgICBpZiAoaXRlbVs0XSkge1xuICAgICAgICBjb250ZW50ICs9IFwifVwiO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGNvbnRlbnQ7XG4gICAgfSkuam9pbihcIlwiKTtcbiAgfTtcblxuICAvLyBpbXBvcnQgYSBsaXN0IG9mIG1vZHVsZXMgaW50byB0aGUgbGlzdFxuICBsaXN0LmkgPSBmdW5jdGlvbiBpKG1vZHVsZXMsIG1lZGlhLCBkZWR1cGUsIHN1cHBvcnRzLCBsYXllcikge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlcyA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgbW9kdWxlcyA9IFtbbnVsbCwgbW9kdWxlcywgdW5kZWZpbmVkXV07XG4gICAgfVxuICAgIHZhciBhbHJlYWR5SW1wb3J0ZWRNb2R1bGVzID0ge307XG4gICAgaWYgKGRlZHVwZSkge1xuICAgICAgZm9yICh2YXIgayA9IDA7IGsgPCB0aGlzLmxlbmd0aDsgaysrKSB7XG4gICAgICAgIHZhciBpZCA9IHRoaXNba11bMF07XG4gICAgICAgIGlmIChpZCAhPSBudWxsKSB7XG4gICAgICAgICAgYWxyZWFkeUltcG9ydGVkTW9kdWxlc1tpZF0gPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGZvciAodmFyIF9rID0gMDsgX2sgPCBtb2R1bGVzLmxlbmd0aDsgX2srKykge1xuICAgICAgdmFyIGl0ZW0gPSBbXS5jb25jYXQobW9kdWxlc1tfa10pO1xuICAgICAgaWYgKGRlZHVwZSAmJiBhbHJlYWR5SW1wb3J0ZWRNb2R1bGVzW2l0ZW1bMF1dKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaWYgKHR5cGVvZiBsYXllciAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICBpZiAodHlwZW9mIGl0ZW1bNV0gPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICBpdGVtWzVdID0gbGF5ZXI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaXRlbVsxXSA9IFwiQGxheWVyXCIuY29uY2F0KGl0ZW1bNV0ubGVuZ3RoID4gMCA/IFwiIFwiLmNvbmNhdChpdGVtWzVdKSA6IFwiXCIsIFwiIHtcIikuY29uY2F0KGl0ZW1bMV0sIFwifVwiKTtcbiAgICAgICAgICBpdGVtWzVdID0gbGF5ZXI7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChtZWRpYSkge1xuICAgICAgICBpZiAoIWl0ZW1bMl0pIHtcbiAgICAgICAgICBpdGVtWzJdID0gbWVkaWE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaXRlbVsxXSA9IFwiQG1lZGlhIFwiLmNvbmNhdChpdGVtWzJdLCBcIiB7XCIpLmNvbmNhdChpdGVtWzFdLCBcIn1cIik7XG4gICAgICAgICAgaXRlbVsyXSA9IG1lZGlhO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoc3VwcG9ydHMpIHtcbiAgICAgICAgaWYgKCFpdGVtWzRdKSB7XG4gICAgICAgICAgaXRlbVs0XSA9IFwiXCIuY29uY2F0KHN1cHBvcnRzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpdGVtWzFdID0gXCJAc3VwcG9ydHMgKFwiLmNvbmNhdChpdGVtWzRdLCBcIikge1wiKS5jb25jYXQoaXRlbVsxXSwgXCJ9XCIpO1xuICAgICAgICAgIGl0ZW1bNF0gPSBzdXBwb3J0cztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgbGlzdC5wdXNoKGl0ZW0pO1xuICAgIH1cbiAgfTtcbiAgcmV0dXJuIGxpc3Q7XG59OyIsIlwidXNlIHN0cmljdFwiO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICh1cmwsIG9wdGlvbnMpIHtcbiAgaWYgKCFvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IHt9O1xuICB9XG4gIGlmICghdXJsKSB7XG4gICAgcmV0dXJuIHVybDtcbiAgfVxuICB1cmwgPSBTdHJpbmcodXJsLl9fZXNNb2R1bGUgPyB1cmwuZGVmYXVsdCA6IHVybCk7XG5cbiAgLy8gSWYgdXJsIGlzIGFscmVhZHkgd3JhcHBlZCBpbiBxdW90ZXMsIHJlbW92ZSB0aGVtXG4gIGlmICgvXlsnXCJdLipbJ1wiXSQvLnRlc3QodXJsKSkge1xuICAgIHVybCA9IHVybC5zbGljZSgxLCAtMSk7XG4gIH1cbiAgaWYgKG9wdGlvbnMuaGFzaCkge1xuICAgIHVybCArPSBvcHRpb25zLmhhc2g7XG4gIH1cblxuICAvLyBTaG91bGQgdXJsIGJlIHdyYXBwZWQ/XG4gIC8vIFNlZSBodHRwczovL2RyYWZ0cy5jc3N3Zy5vcmcvY3NzLXZhbHVlcy0zLyN1cmxzXG4gIGlmICgvW1wiJygpIFxcdFxcbl18KCUyMCkvLnRlc3QodXJsKSB8fCBvcHRpb25zLm5lZWRRdW90ZXMpIHtcbiAgICByZXR1cm4gXCJcXFwiXCIuY29uY2F0KHVybC5yZXBsYWNlKC9cIi9nLCAnXFxcXFwiJykucmVwbGFjZSgvXFxuL2csIFwiXFxcXG5cIiksIFwiXFxcIlwiKTtcbiAgfVxuICByZXR1cm4gdXJsO1xufTsiLCJcInVzZSBzdHJpY3RcIjtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoaXRlbSkge1xuICB2YXIgY29udGVudCA9IGl0ZW1bMV07XG4gIHZhciBjc3NNYXBwaW5nID0gaXRlbVszXTtcbiAgaWYgKCFjc3NNYXBwaW5nKSB7XG4gICAgcmV0dXJuIGNvbnRlbnQ7XG4gIH1cbiAgaWYgKHR5cGVvZiBidG9hID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICB2YXIgYmFzZTY0ID0gYnRvYSh1bmVzY2FwZShlbmNvZGVVUklDb21wb25lbnQoSlNPTi5zdHJpbmdpZnkoY3NzTWFwcGluZykpKSk7XG4gICAgdmFyIGRhdGEgPSBcInNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ9dXRmLTg7YmFzZTY0LFwiLmNvbmNhdChiYXNlNjQpO1xuICAgIHZhciBzb3VyY2VNYXBwaW5nID0gXCIvKiMgXCIuY29uY2F0KGRhdGEsIFwiICovXCIpO1xuICAgIHJldHVybiBbY29udGVudF0uY29uY2F0KFtzb3VyY2VNYXBwaW5nXSkuam9pbihcIlxcblwiKTtcbiAgfVxuICByZXR1cm4gW2NvbnRlbnRdLmpvaW4oXCJcXG5cIik7XG59OyIsIlxuICAgICAgaW1wb3J0IEFQSSBmcm9tIFwiIS4uLy4uLy4uL25vZGVfbW9kdWxlcy9zdHlsZS1sb2FkZXIvZGlzdC9ydW50aW1lL2luamVjdFN0eWxlc0ludG9TdHlsZVRhZy5qc1wiO1xuICAgICAgaW1wb3J0IGRvbUFQSSBmcm9tIFwiIS4uLy4uLy4uL25vZGVfbW9kdWxlcy9zdHlsZS1sb2FkZXIvZGlzdC9ydW50aW1lL3N0eWxlRG9tQVBJLmpzXCI7XG4gICAgICBpbXBvcnQgaW5zZXJ0Rm4gZnJvbSBcIiEuLi8uLi8uLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2Rpc3QvcnVudGltZS9pbnNlcnRCeVNlbGVjdG9yLmpzXCI7XG4gICAgICBpbXBvcnQgc2V0QXR0cmlidXRlcyBmcm9tIFwiIS4uLy4uLy4uL25vZGVfbW9kdWxlcy9zdHlsZS1sb2FkZXIvZGlzdC9ydW50aW1lL3NldEF0dHJpYnV0ZXNXaXRob3V0QXR0cmlidXRlcy5qc1wiO1xuICAgICAgaW1wb3J0IGluc2VydFN0eWxlRWxlbWVudCBmcm9tIFwiIS4uLy4uLy4uL25vZGVfbW9kdWxlcy9zdHlsZS1sb2FkZXIvZGlzdC9ydW50aW1lL2luc2VydFN0eWxlRWxlbWVudC5qc1wiO1xuICAgICAgaW1wb3J0IHN0eWxlVGFnVHJhbnNmb3JtRm4gZnJvbSBcIiEuLi8uLi8uLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2Rpc3QvcnVudGltZS9zdHlsZVRhZ1RyYW5zZm9ybS5qc1wiO1xuICAgICAgaW1wb3J0IGNvbnRlbnQsICogYXMgbmFtZWRFeHBvcnQgZnJvbSBcIiEhLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvZGlzdC9janMuanMhLi9mb3JtLmNzc1wiO1xuICAgICAgXG4gICAgICBcblxudmFyIG9wdGlvbnMgPSB7fTtcblxub3B0aW9ucy5zdHlsZVRhZ1RyYW5zZm9ybSA9IHN0eWxlVGFnVHJhbnNmb3JtRm47XG5vcHRpb25zLnNldEF0dHJpYnV0ZXMgPSBzZXRBdHRyaWJ1dGVzO1xuXG4gICAgICBvcHRpb25zLmluc2VydCA9IGluc2VydEZuLmJpbmQobnVsbCwgXCJoZWFkXCIpO1xuICAgIFxub3B0aW9ucy5kb21BUEkgPSBkb21BUEk7XG5vcHRpb25zLmluc2VydFN0eWxlRWxlbWVudCA9IGluc2VydFN0eWxlRWxlbWVudDtcblxudmFyIHVwZGF0ZSA9IEFQSShjb250ZW50LCBvcHRpb25zKTtcblxuXG5cbmV4cG9ydCAqIGZyb20gXCIhIS4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2Rpc3QvY2pzLmpzIS4vZm9ybS5jc3NcIjtcbiAgICAgICBleHBvcnQgZGVmYXVsdCBjb250ZW50ICYmIGNvbnRlbnQubG9jYWxzID8gY29udGVudC5sb2NhbHMgOiB1bmRlZmluZWQ7XG4iLCJcbiAgICAgIGltcG9ydCBBUEkgZnJvbSBcIiEuLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2Rpc3QvcnVudGltZS9pbmplY3RTdHlsZXNJbnRvU3R5bGVUYWcuanNcIjtcbiAgICAgIGltcG9ydCBkb21BUEkgZnJvbSBcIiEuLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2Rpc3QvcnVudGltZS9zdHlsZURvbUFQSS5qc1wiO1xuICAgICAgaW1wb3J0IGluc2VydEZuIGZyb20gXCIhLi4vbm9kZV9tb2R1bGVzL3N0eWxlLWxvYWRlci9kaXN0L3J1bnRpbWUvaW5zZXJ0QnlTZWxlY3Rvci5qc1wiO1xuICAgICAgaW1wb3J0IHNldEF0dHJpYnV0ZXMgZnJvbSBcIiEuLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2Rpc3QvcnVudGltZS9zZXRBdHRyaWJ1dGVzV2l0aG91dEF0dHJpYnV0ZXMuanNcIjtcbiAgICAgIGltcG9ydCBpbnNlcnRTdHlsZUVsZW1lbnQgZnJvbSBcIiEuLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2Rpc3QvcnVudGltZS9pbnNlcnRTdHlsZUVsZW1lbnQuanNcIjtcbiAgICAgIGltcG9ydCBzdHlsZVRhZ1RyYW5zZm9ybUZuIGZyb20gXCIhLi4vbm9kZV9tb2R1bGVzL3N0eWxlLWxvYWRlci9kaXN0L3J1bnRpbWUvc3R5bGVUYWdUcmFuc2Zvcm0uanNcIjtcbiAgICAgIGltcG9ydCBjb250ZW50LCAqIGFzIG5hbWVkRXhwb3J0IGZyb20gXCIhIS4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2Rpc3QvY2pzLmpzIS4vaW5kZXguY3NzXCI7XG4gICAgICBcbiAgICAgIFxuXG52YXIgb3B0aW9ucyA9IHt9O1xuXG5vcHRpb25zLnN0eWxlVGFnVHJhbnNmb3JtID0gc3R5bGVUYWdUcmFuc2Zvcm1Gbjtcbm9wdGlvbnMuc2V0QXR0cmlidXRlcyA9IHNldEF0dHJpYnV0ZXM7XG5cbiAgICAgIG9wdGlvbnMuaW5zZXJ0ID0gaW5zZXJ0Rm4uYmluZChudWxsLCBcImhlYWRcIik7XG4gICAgXG5vcHRpb25zLmRvbUFQSSA9IGRvbUFQSTtcbm9wdGlvbnMuaW5zZXJ0U3R5bGVFbGVtZW50ID0gaW5zZXJ0U3R5bGVFbGVtZW50O1xuXG52YXIgdXBkYXRlID0gQVBJKGNvbnRlbnQsIG9wdGlvbnMpO1xuXG5cblxuZXhwb3J0ICogZnJvbSBcIiEhLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvZGlzdC9janMuanMhLi9pbmRleC5jc3NcIjtcbiAgICAgICBleHBvcnQgZGVmYXVsdCBjb250ZW50ICYmIGNvbnRlbnQubG9jYWxzID8gY29udGVudC5sb2NhbHMgOiB1bmRlZmluZWQ7XG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIHN0eWxlc0luRE9NID0gW107XG5mdW5jdGlvbiBnZXRJbmRleEJ5SWRlbnRpZmllcihpZGVudGlmaWVyKSB7XG4gIHZhciByZXN1bHQgPSAtMTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHlsZXNJbkRPTS5sZW5ndGg7IGkrKykge1xuICAgIGlmIChzdHlsZXNJbkRPTVtpXS5pZGVudGlmaWVyID09PSBpZGVudGlmaWVyKSB7XG4gICAgICByZXN1bHQgPSBpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5mdW5jdGlvbiBtb2R1bGVzVG9Eb20obGlzdCwgb3B0aW9ucykge1xuICB2YXIgaWRDb3VudE1hcCA9IHt9O1xuICB2YXIgaWRlbnRpZmllcnMgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGl0ZW0gPSBsaXN0W2ldO1xuICAgIHZhciBpZCA9IG9wdGlvbnMuYmFzZSA/IGl0ZW1bMF0gKyBvcHRpb25zLmJhc2UgOiBpdGVtWzBdO1xuICAgIHZhciBjb3VudCA9IGlkQ291bnRNYXBbaWRdIHx8IDA7XG4gICAgdmFyIGlkZW50aWZpZXIgPSBcIlwiLmNvbmNhdChpZCwgXCIgXCIpLmNvbmNhdChjb3VudCk7XG4gICAgaWRDb3VudE1hcFtpZF0gPSBjb3VudCArIDE7XG4gICAgdmFyIGluZGV4QnlJZGVudGlmaWVyID0gZ2V0SW5kZXhCeUlkZW50aWZpZXIoaWRlbnRpZmllcik7XG4gICAgdmFyIG9iaiA9IHtcbiAgICAgIGNzczogaXRlbVsxXSxcbiAgICAgIG1lZGlhOiBpdGVtWzJdLFxuICAgICAgc291cmNlTWFwOiBpdGVtWzNdLFxuICAgICAgc3VwcG9ydHM6IGl0ZW1bNF0sXG4gICAgICBsYXllcjogaXRlbVs1XVxuICAgIH07XG4gICAgaWYgKGluZGV4QnlJZGVudGlmaWVyICE9PSAtMSkge1xuICAgICAgc3R5bGVzSW5ET01baW5kZXhCeUlkZW50aWZpZXJdLnJlZmVyZW5jZXMrKztcbiAgICAgIHN0eWxlc0luRE9NW2luZGV4QnlJZGVudGlmaWVyXS51cGRhdGVyKG9iaik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciB1cGRhdGVyID0gYWRkRWxlbWVudFN0eWxlKG9iaiwgb3B0aW9ucyk7XG4gICAgICBvcHRpb25zLmJ5SW5kZXggPSBpO1xuICAgICAgc3R5bGVzSW5ET00uc3BsaWNlKGksIDAsIHtcbiAgICAgICAgaWRlbnRpZmllcjogaWRlbnRpZmllcixcbiAgICAgICAgdXBkYXRlcjogdXBkYXRlcixcbiAgICAgICAgcmVmZXJlbmNlczogMVxuICAgICAgfSk7XG4gICAgfVxuICAgIGlkZW50aWZpZXJzLnB1c2goaWRlbnRpZmllcik7XG4gIH1cbiAgcmV0dXJuIGlkZW50aWZpZXJzO1xufVxuZnVuY3Rpb24gYWRkRWxlbWVudFN0eWxlKG9iaiwgb3B0aW9ucykge1xuICB2YXIgYXBpID0gb3B0aW9ucy5kb21BUEkob3B0aW9ucyk7XG4gIGFwaS51cGRhdGUob2JqKTtcbiAgdmFyIHVwZGF0ZXIgPSBmdW5jdGlvbiB1cGRhdGVyKG5ld09iaikge1xuICAgIGlmIChuZXdPYmopIHtcbiAgICAgIGlmIChuZXdPYmouY3NzID09PSBvYmouY3NzICYmIG5ld09iai5tZWRpYSA9PT0gb2JqLm1lZGlhICYmIG5ld09iai5zb3VyY2VNYXAgPT09IG9iai5zb3VyY2VNYXAgJiYgbmV3T2JqLnN1cHBvcnRzID09PSBvYmouc3VwcG9ydHMgJiYgbmV3T2JqLmxheWVyID09PSBvYmoubGF5ZXIpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgYXBpLnVwZGF0ZShvYmogPSBuZXdPYmopO1xuICAgIH0gZWxzZSB7XG4gICAgICBhcGkucmVtb3ZlKCk7XG4gICAgfVxuICB9O1xuICByZXR1cm4gdXBkYXRlcjtcbn1cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGxpc3QsIG9wdGlvbnMpIHtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIGxpc3QgPSBsaXN0IHx8IFtdO1xuICB2YXIgbGFzdElkZW50aWZpZXJzID0gbW9kdWxlc1RvRG9tKGxpc3QsIG9wdGlvbnMpO1xuICByZXR1cm4gZnVuY3Rpb24gdXBkYXRlKG5ld0xpc3QpIHtcbiAgICBuZXdMaXN0ID0gbmV3TGlzdCB8fCBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxhc3RJZGVudGlmaWVycy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGlkZW50aWZpZXIgPSBsYXN0SWRlbnRpZmllcnNbaV07XG4gICAgICB2YXIgaW5kZXggPSBnZXRJbmRleEJ5SWRlbnRpZmllcihpZGVudGlmaWVyKTtcbiAgICAgIHN0eWxlc0luRE9NW2luZGV4XS5yZWZlcmVuY2VzLS07XG4gICAgfVxuICAgIHZhciBuZXdMYXN0SWRlbnRpZmllcnMgPSBtb2R1bGVzVG9Eb20obmV3TGlzdCwgb3B0aW9ucyk7XG4gICAgZm9yICh2YXIgX2kgPSAwOyBfaSA8IGxhc3RJZGVudGlmaWVycy5sZW5ndGg7IF9pKyspIHtcbiAgICAgIHZhciBfaWRlbnRpZmllciA9IGxhc3RJZGVudGlmaWVyc1tfaV07XG4gICAgICB2YXIgX2luZGV4ID0gZ2V0SW5kZXhCeUlkZW50aWZpZXIoX2lkZW50aWZpZXIpO1xuICAgICAgaWYgKHN0eWxlc0luRE9NW19pbmRleF0ucmVmZXJlbmNlcyA9PT0gMCkge1xuICAgICAgICBzdHlsZXNJbkRPTVtfaW5kZXhdLnVwZGF0ZXIoKTtcbiAgICAgICAgc3R5bGVzSW5ET00uc3BsaWNlKF9pbmRleCwgMSk7XG4gICAgICB9XG4gICAgfVxuICAgIGxhc3RJZGVudGlmaWVycyA9IG5ld0xhc3RJZGVudGlmaWVycztcbiAgfTtcbn07IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBtZW1vID0ge307XG5cbi8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICAqL1xuZnVuY3Rpb24gZ2V0VGFyZ2V0KHRhcmdldCkge1xuICBpZiAodHlwZW9mIG1lbW9bdGFyZ2V0XSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgIHZhciBzdHlsZVRhcmdldCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IodGFyZ2V0KTtcblxuICAgIC8vIFNwZWNpYWwgY2FzZSB0byByZXR1cm4gaGVhZCBvZiBpZnJhbWUgaW5zdGVhZCBvZiBpZnJhbWUgaXRzZWxmXG4gICAgaWYgKHdpbmRvdy5IVE1MSUZyYW1lRWxlbWVudCAmJiBzdHlsZVRhcmdldCBpbnN0YW5jZW9mIHdpbmRvdy5IVE1MSUZyYW1lRWxlbWVudCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgLy8gVGhpcyB3aWxsIHRocm93IGFuIGV4Y2VwdGlvbiBpZiBhY2Nlc3MgdG8gaWZyYW1lIGlzIGJsb2NrZWRcbiAgICAgICAgLy8gZHVlIHRvIGNyb3NzLW9yaWdpbiByZXN0cmljdGlvbnNcbiAgICAgICAgc3R5bGVUYXJnZXQgPSBzdHlsZVRhcmdldC5jb250ZW50RG9jdW1lbnQuaGVhZDtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgLy8gaXN0YW5idWwgaWdub3JlIG5leHRcbiAgICAgICAgc3R5bGVUYXJnZXQgPSBudWxsO1xuICAgICAgfVxuICAgIH1cbiAgICBtZW1vW3RhcmdldF0gPSBzdHlsZVRhcmdldDtcbiAgfVxuICByZXR1cm4gbWVtb1t0YXJnZXRdO1xufVxuXG4vKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAgKi9cbmZ1bmN0aW9uIGluc2VydEJ5U2VsZWN0b3IoaW5zZXJ0LCBzdHlsZSkge1xuICB2YXIgdGFyZ2V0ID0gZ2V0VGFyZ2V0KGluc2VydCk7XG4gIGlmICghdGFyZ2V0KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiQ291bGRuJ3QgZmluZCBhIHN0eWxlIHRhcmdldC4gVGhpcyBwcm9iYWJseSBtZWFucyB0aGF0IHRoZSB2YWx1ZSBmb3IgdGhlICdpbnNlcnQnIHBhcmFtZXRlciBpcyBpbnZhbGlkLlwiKTtcbiAgfVxuICB0YXJnZXQuYXBwZW5kQ2hpbGQoc3R5bGUpO1xufVxubW9kdWxlLmV4cG9ydHMgPSBpbnNlcnRCeVNlbGVjdG9yOyIsIlwidXNlIHN0cmljdFwiO1xuXG4vKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAgKi9cbmZ1bmN0aW9uIGluc2VydFN0eWxlRWxlbWVudChvcHRpb25zKSB7XG4gIHZhciBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInN0eWxlXCIpO1xuICBvcHRpb25zLnNldEF0dHJpYnV0ZXMoZWxlbWVudCwgb3B0aW9ucy5hdHRyaWJ1dGVzKTtcbiAgb3B0aW9ucy5pbnNlcnQoZWxlbWVudCwgb3B0aW9ucy5vcHRpb25zKTtcbiAgcmV0dXJuIGVsZW1lbnQ7XG59XG5tb2R1bGUuZXhwb3J0cyA9IGluc2VydFN0eWxlRWxlbWVudDsiLCJcInVzZSBzdHJpY3RcIjtcblxuLyogaXN0YW5idWwgaWdub3JlIG5leHQgICovXG5mdW5jdGlvbiBzZXRBdHRyaWJ1dGVzV2l0aG91dEF0dHJpYnV0ZXMoc3R5bGVFbGVtZW50KSB7XG4gIHZhciBub25jZSA9IHR5cGVvZiBfX3dlYnBhY2tfbm9uY2VfXyAhPT0gXCJ1bmRlZmluZWRcIiA/IF9fd2VicGFja19ub25jZV9fIDogbnVsbDtcbiAgaWYgKG5vbmNlKSB7XG4gICAgc3R5bGVFbGVtZW50LnNldEF0dHJpYnV0ZShcIm5vbmNlXCIsIG5vbmNlKTtcbiAgfVxufVxubW9kdWxlLmV4cG9ydHMgPSBzZXRBdHRyaWJ1dGVzV2l0aG91dEF0dHJpYnV0ZXM7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbi8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICAqL1xuZnVuY3Rpb24gYXBwbHkoc3R5bGVFbGVtZW50LCBvcHRpb25zLCBvYmopIHtcbiAgdmFyIGNzcyA9IFwiXCI7XG4gIGlmIChvYmouc3VwcG9ydHMpIHtcbiAgICBjc3MgKz0gXCJAc3VwcG9ydHMgKFwiLmNvbmNhdChvYmouc3VwcG9ydHMsIFwiKSB7XCIpO1xuICB9XG4gIGlmIChvYmoubWVkaWEpIHtcbiAgICBjc3MgKz0gXCJAbWVkaWEgXCIuY29uY2F0KG9iai5tZWRpYSwgXCIge1wiKTtcbiAgfVxuICB2YXIgbmVlZExheWVyID0gdHlwZW9mIG9iai5sYXllciAhPT0gXCJ1bmRlZmluZWRcIjtcbiAgaWYgKG5lZWRMYXllcikge1xuICAgIGNzcyArPSBcIkBsYXllclwiLmNvbmNhdChvYmoubGF5ZXIubGVuZ3RoID4gMCA/IFwiIFwiLmNvbmNhdChvYmoubGF5ZXIpIDogXCJcIiwgXCIge1wiKTtcbiAgfVxuICBjc3MgKz0gb2JqLmNzcztcbiAgaWYgKG5lZWRMYXllcikge1xuICAgIGNzcyArPSBcIn1cIjtcbiAgfVxuICBpZiAob2JqLm1lZGlhKSB7XG4gICAgY3NzICs9IFwifVwiO1xuICB9XG4gIGlmIChvYmouc3VwcG9ydHMpIHtcbiAgICBjc3MgKz0gXCJ9XCI7XG4gIH1cbiAgdmFyIHNvdXJjZU1hcCA9IG9iai5zb3VyY2VNYXA7XG4gIGlmIChzb3VyY2VNYXAgJiYgdHlwZW9mIGJ0b2EgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICBjc3MgKz0gXCJcXG4vKiMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LFwiLmNvbmNhdChidG9hKHVuZXNjYXBlKGVuY29kZVVSSUNvbXBvbmVudChKU09OLnN0cmluZ2lmeShzb3VyY2VNYXApKSkpLCBcIiAqL1wiKTtcbiAgfVxuXG4gIC8vIEZvciBvbGQgSUVcbiAgLyogaXN0YW5idWwgaWdub3JlIGlmICAqL1xuICBvcHRpb25zLnN0eWxlVGFnVHJhbnNmb3JtKGNzcywgc3R5bGVFbGVtZW50LCBvcHRpb25zLm9wdGlvbnMpO1xufVxuZnVuY3Rpb24gcmVtb3ZlU3R5bGVFbGVtZW50KHN0eWxlRWxlbWVudCkge1xuICAvLyBpc3RhbmJ1bCBpZ25vcmUgaWZcbiAgaWYgKHN0eWxlRWxlbWVudC5wYXJlbnROb2RlID09PSBudWxsKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHN0eWxlRWxlbWVudC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHN0eWxlRWxlbWVudCk7XG59XG5cbi8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICAqL1xuZnVuY3Rpb24gZG9tQVBJKG9wdGlvbnMpIHtcbiAgaWYgKHR5cGVvZiBkb2N1bWVudCA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgIHJldHVybiB7XG4gICAgICB1cGRhdGU6IGZ1bmN0aW9uIHVwZGF0ZSgpIHt9LFxuICAgICAgcmVtb3ZlOiBmdW5jdGlvbiByZW1vdmUoKSB7fVxuICAgIH07XG4gIH1cbiAgdmFyIHN0eWxlRWxlbWVudCA9IG9wdGlvbnMuaW5zZXJ0U3R5bGVFbGVtZW50KG9wdGlvbnMpO1xuICByZXR1cm4ge1xuICAgIHVwZGF0ZTogZnVuY3Rpb24gdXBkYXRlKG9iaikge1xuICAgICAgYXBwbHkoc3R5bGVFbGVtZW50LCBvcHRpb25zLCBvYmopO1xuICAgIH0sXG4gICAgcmVtb3ZlOiBmdW5jdGlvbiByZW1vdmUoKSB7XG4gICAgICByZW1vdmVTdHlsZUVsZW1lbnQoc3R5bGVFbGVtZW50KTtcbiAgICB9XG4gIH07XG59XG5tb2R1bGUuZXhwb3J0cyA9IGRvbUFQSTsiLCJcInVzZSBzdHJpY3RcIjtcblxuLyogaXN0YW5idWwgaWdub3JlIG5leHQgICovXG5mdW5jdGlvbiBzdHlsZVRhZ1RyYW5zZm9ybShjc3MsIHN0eWxlRWxlbWVudCkge1xuICBpZiAoc3R5bGVFbGVtZW50LnN0eWxlU2hlZXQpIHtcbiAgICBzdHlsZUVsZW1lbnQuc3R5bGVTaGVldC5jc3NUZXh0ID0gY3NzO1xuICB9IGVsc2Uge1xuICAgIHdoaWxlIChzdHlsZUVsZW1lbnQuZmlyc3RDaGlsZCkge1xuICAgICAgc3R5bGVFbGVtZW50LnJlbW92ZUNoaWxkKHN0eWxlRWxlbWVudC5maXJzdENoaWxkKTtcbiAgICB9XG4gICAgc3R5bGVFbGVtZW50LmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGNzcykpO1xuICB9XG59XG5tb2R1bGUuZXhwb3J0cyA9IHN0eWxlVGFnVHJhbnNmb3JtOyJdLCJuYW1lcyI6WyJ2aXNpYmlsaXR5X29uIiwiaW5wdXRzIiwiZW1haWwiLCJlbGVtZW50IiwidGV4dENvbnRlbnQiLCJhdHRyaWJ1dGVzIiwiaWQiLCJjbGFzcyIsIm5hbWUiLCJ0eXBlIiwicGxhY2Vob2xkZXIiLCJyZXF1aXJlZCIsImVycm9yIiwiY291bnRyeSIsImNoaWxkcmVuIiwiY291bnRyaWVzIiwiY2giLCJnYiIsInVzIiwiY2EiLCJ6aXBjb2RlIiwicGFzc3dvcmQiLCJwYXR0ZXJuIiwic2libGluZyIsImNoaWxkIiwic3JjIiwib25sb2FkIiwicGFzc3dvcmRDb25maXJtYXRpb24iLCJmb3JtQnV0dG9ucyIsImNhbmNlbCIsInN1Ym1pdCIsImNyZWF0ZUVsZW1lbnQiLCJ2aXNpYmlsaXR5X29mZiIsInN0YXRlIiwiY2FjaGVET00iLCJjb250YWluZXIiLCJmb3JtIiwicXVlcnlTZWxlY3RvckFsbCIsImJ0bkNhbmNlbCIsInF1ZXJ5U2VsZWN0b3IiLCJ2YWxpZGl0eUVycm9ycyIsImJ0blN1Ym1pdCIsImJ0bnNWaXNpYmlsaXR5IiwiYmluZEV2ZW50cyIsInN1Ym1pdEZvcm0iLCJiaW5kIiwicmVzZXRGb3JtIiwidG9nZ2xlUGFzc3dvcmQiLCJhZGRFdmVudExpc3RlbmVyIiwiZm9yRWFjaCIsImJ0biIsInZhbGlkYXRlSW5wdXQiLCJpbnB1dCIsImJpbmRJbnB1dCIsImV2ZW50VHlwZSIsInJlbmRlciIsImZvcm1FbGVtZW50IiwiZG9jdW1lbnQiLCJzZXRBdHRyaWJ1dGVzIiwibm92YWxpZGF0ZSIsImNsYXNzTGlzdCIsImFkZCIsIk9iamVjdCIsImtleXMiLCJmb3JtSXRlbSIsImZvcm1MYWJlbCIsImZvcm1FcnJvciIsImlucHV0V3JhcHBlciIsImZvcm1JbnB1dCIsImZvciIsImFwcGVuZENoaWxkIiwib3B0aW9ucyIsImkiLCJsZW5ndGgiLCJvcHRpb24iLCJlbnRyaWVzIiwiX3JlZiIsImtleSIsInZhbHVlIiwiYnRuVmlzaWJpbGl0eSIsInZpc2liaWxpdHlJY29uIiwiZm9ybUJ1dHRvbnNDb250YWluZXIiLCJmb3JtQnV0dG9uIiwiZSIsImN1cnJlbnRUYXJnZXQiLCJwcmV2aW91c1NpYmxpbmciLCJpY29uIiwiZmlyc3RDaGlsZCIsIm5ld0ljb24iLCJkYXRhc2V0IiwiaW5qZWN0VXJsIiwicmVwbGFjZVdpdGgiLCJ6aXBjb2RlcyIsInJlbW92ZSIsInN0eWxlIiwiZGlzcGxheSIsInByZXZlbnREZWZhdWx0IiwiZXZlcnkiLCJjb25zb2xlIiwibG9nIiwiZmluZCIsInZhbGlkaXR5RXJyb3IiLCJjb250YWlucyIsImlucHV0Q291bnRyeSIsInppcENvdW50cnkiLCJ2YWx1ZXMiLCJpc28iLCJyZWdleCIsInZhbGlkaXR5IiwiY2hlY2tWYWxpZGl0eSIsInJlbW92ZUV2ZW50TGlzdGVuZXIiLCJmb3JtVmFsaWRhdGlvbkNvbnRyb2xsZXIiLCJpbml0Rm9ybSIsInNlY3Rpb25zIiwic3BsaWNlIiwiaW5kZXhPZiIsInNlY3Rpb24iLCJTVkdJbmplY3QiLCJib2R5Iiwic2V0RWxlbWVudFN0YXRlIiwic2V0QXR0cmlidXRlIiwiQnVpbGRFbGVtZW50IiwiaHRtbEVsZW1lbnQiLCJhc3NpZ24iXSwic291cmNlUm9vdCI6IiJ9