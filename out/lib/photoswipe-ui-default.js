'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(factory);
    } else if ((typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object') {
        module.exports = factory(require, exports, module);
    } else {
        root.ZVUIPinch_Default = factory();
    }
})(undefined, function (require, exports, module) {

    return function (zvuiPinch, helper) {
        /**
        *
        * UI on top of main sliding area (caption, arrows, close button, etc.).
        * Built just using public methods/properties of PhotoSwipe.
        *
        */
        var ui = this;
        var _overlayUIUpdated = false;
        var _controlsVisible = true;
        var _fullscrenAPI = void 0;
        var _controls = void 0;
        var _captionContainer = void 0;
        var _fakeCaptionContainer = void 0;
        var _indexIndicator = void 0;
        var _initalCloseOnScrollValue = void 0;
        var _isIdle = void 0;
        var _listen = void 0;
        var _loadingIndicator = void 0;
        var _loadingIndicatorHidden = void 0;
        var _loadingIndicatorTimeout = void 0;
        var _galleryHasOneSlide = void 0;
        var _options = void 0;

        var _defaultUIOptions = {
            barsSize: {
                top: 44,
                bottom: 'auto'
            },
            closeElClasses: ['item', 'caption', 'zoom-wrap', 'ui', 'top-bar'],
            timeToIdle: 4000,
            timeToIdleOutside: 1000,
            loadingIndicatorDelay: 100, // 2s

            addCaptionHTMLFn: function addCaptionHTMLFn(item, captionEl /*, isFake */) {
                if (!item.title) {
                    captionEl.children[0].innerHTML = '';
                    return false;
                }
                captionEl.children[0].innerHTML = item.title;
                return true;
            },


            closeEl: false,
            captionEl: false,
            fullscreenEl: false,
            zoomEl: true,
            counterEl: false,
            arrowEl: false,
            preloaderEl: true,

            tapToClose: true,
            tapToToggleControls: true,

            clickToCloseNonZoomable: false,

            indexIndicatorSep: ' / ',
            fitControlsWidth: 1200

        };

        var _blockControlsTap = void 0;
        var _blockControlsTapTimeout = void 0;

        var _onControlsTap = function _onControlsTap(e) {
            if (_blockControlsTap) {
                return true;
            }

            e = e || window.event;

            if (_options.timeToIdle && _options.mouseUsed && !_isIdle) {
                // reset idle timer
                _onIdleMouseMove();
            }

            var target = e.target || e.srcElement;
            var uiElement = void 0;
            var clickedClass = target.getAttribute('class') || '';
            var found = void 0;

            for (var i = 0; i < _uiElements.length; i++) {
                uiElement = _uiElements[i];
                if (uiElement.onTap && clickedClass.includes('zvui-pinch__' + uiElement.name)) {
                    uiElement.onTap();
                    found = true;
                }
            }

            if (found) {
                if (e.stopPropagation) {
                    e.stopPropagation();
                }
                _blockControlsTap = true;

                // Some versions of Android don't prevent ghost click event
                // when preventDefault() was called on touchstart and/or touchend.
                //
                // This happens on v4.3, 4.2, 4.1,
                // older versions strangely work correctly,
                // but just in case we add delay on all of them)
                var tapDelay = helper.features.isOldAndroid ? 600 : 30;
                _blockControlsTapTimeout = setTimeout(function () {
                    _blockControlsTap = false;
                }, tapDelay);
            }
        };

        var _fitControlsInViewport = function _fitControlsInViewport() {
            return !zvuiPinch.likelyTouchDevice || _options.mouseUsed || screen.width > _options.fitControlsWidth;
        };

        var _toggleZvuiPinchClass = function _toggleZvuiPinchClass(el, cName, add) {
            helper[(add ? 'add' : 'remove') + 'Class'](el, 'zvui-pinch__' + cName);
        };

        var _countNumItems = function _countNumItems() {
            // add class when there is just one item in the gallery
            // (by default it hides left/right arrows and 1ofX counter)
            var hasOneSlide = _options.getNumItemsFn() === 1;
            if (hasOneSlide !== _galleryHasOneSlide) {
                _toggleZvuiPinchClass(_controls, 'ui--one-slide', hasOneSlide);
                _galleryHasOneSlide = hasOneSlide;
            }
        };

        var _hasCloseClass = function _hasCloseClass(target) {
            for (var i = 0; i < _options.closeElClasses.length; i++) {
                if (helper.hasClass(target, 'zvui-pinch__' + _options.closeElClasses[i])) {
                    return true;
                }
            }
        };

        var _idleInterval = void 0;
        var _idleTimer = void 0;
        var _idleIncrement = 0;

        var _onIdleMouseMove = function _onIdleMouseMove() {
            clearTimeout(_idleTimer);
            _idleIncrement = 0;
            if (_isIdle) {
                ui.setIdle(false);
            }
        };

        var _onMouseLeaveWindow = function _onMouseLeaveWindow(e) {
            e = e ? e : window.event;
            var from = e.relatedTarget || e.toElement;
            if (!from || from.nodeName === 'HTML') {
                clearTimeout(_idleTimer);
                _idleTimer = setTimeout(function () {
                    ui.setIdle(true);
                }, _options.timeToIdleOutside);
            }
        };

        var _setupFullscreenAPI = function _setupFullscreenAPI() {
            if (_options.fullscreenEl && !helper.features.isOldAndroid) {
                if (!_fullscrenAPI) {
                    _fullscrenAPI = ui.getFullscreenAPI();
                }
                if (_fullscrenAPI) {
                    helper.bind(document, _fullscrenAPI.eventK, ui.updateFullscreen);
                    ui.updateFullscreen();
                    helper.addClass(zvuiPinch.template, 'zvui-pinch--supports-fs');
                } else {
                    helper.removeClass(zvuiPinch.template, 'zvui-pinch--supports-fs');
                }
            }
        };

        var _setupLoadingIndicator = function _setupLoadingIndicator() {
            // Setup loading indicator
            if (_options.preloaderEl) {

                _toggleLoadingIndicator(true);

                _listen('beforeChange', function () {

                    clearTimeout(_loadingIndicatorTimeout);

                    // display loading indicator with delay
                    _loadingIndicatorTimeout = setTimeout(function () {

                        if (zvuiPinch.currItem && zvuiPinch.currItem.loading) {

                            if (!zvuiPinch.allowProgressiveImg() || zvuiPinch.currItem.img && !zvuiPinch.currItem.img.naturalWidth) {
                                // show preloader if progressive loading is not enabled,
                                // or image width is not defined yet (because of slow connection)
                                _toggleLoadingIndicator(false);
                                // items-controller.js function allowProgressiveImg
                            }
                        } else {
                            _toggleLoadingIndicator(true); // hide preloader
                        }
                    }, _options.loadingIndicatorDelay);
                });
                _listen('imageLoadComplete', function (index, item) {
                    if (zvuiPinch.currItem === item) {
                        _toggleLoadingIndicator(true);
                    }
                });
            }
        };

        var _toggleLoadingIndicator = function _toggleLoadingIndicator(hide) {
            if (_loadingIndicatorHidden !== hide) {
                _toggleZvuiPinchClass(_loadingIndicator, 'preloader--active', !hide);
                _loadingIndicatorHidden = hide;
            }
        };

        var _applyNavBarGaps = function _applyNavBarGaps(item) {
            var gap = item.vGap;

            if (_fitControlsInViewport()) {

                var bars = _options.barsSize;
                if (_options.captionEl && bars.bottom === 'auto') {
                    if (!_fakeCaptionContainer) {
                        _fakeCaptionContainer = helper.createEl('zvui-pinch__caption zvui-pinch__caption--fake');
                        _fakeCaptionContainer.appendChild(helper.createEl('zvui-pinch__caption__center'));
                        _controls.insertBefore(_fakeCaptionContainer, _captionContainer);
                        helper.addClass(_controls, 'zvui-pinch__ui--fit');
                    }
                    if (_options.addCaptionHTMLFn(item, _fakeCaptionContainer, true)) {

                        var captionSize = _fakeCaptionContainer.clientHeight;
                        gap.bottom = parseInt(captionSize, 10) || 44;
                    } else {
                        gap.bottom = bars.top; // if no caption, set size of bottom gap to size of top
                    }
                } else {
                    gap.bottom = bars.bottom === 'auto' ? 0 : bars.bottom;
                }

                // height of top bar is static, no need to calculate it
                gap.top = bars.top;
            } else {
                gap.top = gap.bottom = 0;
            }
        };

        var _setupIdle = function _setupIdle() {
            // Hide controls when mouse is used
            if (_options.timeToIdle) {
                _listen('mouseUsed', function () {

                    helper.bind(document, 'mousemove', _onIdleMouseMove);
                    helper.bind(document, 'mouseout', _onMouseLeaveWindow);

                    _idleInterval = setInterval(function () {
                        _idleIncrement++;
                        if (_idleIncrement === 2) {
                            ui.setIdle(true);
                        }
                    }, _options.timeToIdle / 2);
                });
            }
        };

        var _setupHidingControlsDuringGestures = function _setupHidingControlsDuringGestures() {

            // Hide controls on vertical drag
            _listen('onVerticalDrag', function (now) {
                if (_controlsVisible && now < 0.95) {
                    ui.hideControls();
                } else if (!_controlsVisible && now >= 0.95) {
                    ui.showControls();
                }
            });

            // Hide controls when pinching to close
            var pinchControlsHidden = void 0;
            _listen('onPinchClose', function (now) {
                if (_controlsVisible && now < 0.9) {
                    ui.hideControls();
                    pinchControlsHidden = true;
                } else if (pinchControlsHidden && !_controlsVisible && now > 0.9) {
                    ui.showControls();
                }
            });

            _listen('zoomGestureEnded', function () {
                pinchControlsHidden = false;
                if (pinchControlsHidden && !_controlsVisible) {
                    ui.showControls();
                }
            });
        };

        var _uiElements = [{
            name: 'button--zoom',
            option: 'zoomEl',
            onTap: zvuiPinch.toggleDesktopZoom
        }, {
            name: 'button--close',
            option: 'closeEl',
            onTap: zvuiPinch.close
        }, {
            name: 'button--fs',
            option: 'fullscreenEl',
            onTap: function onTap() {
                if (_fullscrenAPI.isFullscreen()) {
                    _fullscrenAPI.exit();
                } else {
                    _fullscrenAPI.enter();
                }
            }
        }, {
            name: 'preloader',
            option: 'preloaderEl',
            onInit: function onInit(el) {
                _loadingIndicator = el;
            }
        }];

        var _setupUIElements = function _setupUIElements() {
            var item = void 0;
            var classAttr = void 0;
            var uiElement = void 0;

            var loopThroughChildElements = function loopThroughChildElements(sChildren) {
                if (!sChildren) {
                    return;
                }

                var l = sChildren.length;
                for (var i = 0; i < l; i++) {
                    item = sChildren[i];
                    classAttr = item.className;

                    for (var a = 0; a < _uiElements.length; a++) {
                        uiElement = _uiElements[a];

                        if (classAttr.includes('zvui-pinch__' + uiElement.name)) {

                            if (_options[uiElement.option]) {
                                // if element is not disabled from options

                                helper.removeClass(item, 'zvui-pinch__element--disabled');
                                if (uiElement.onInit) {
                                    uiElement.onInit(item);
                                }

                                //item.style.display = 'block';
                            } else {
                                helper.addClass(item, 'zvui-pinch__element--disabled');
                                //item.style.display = 'none';
                            }
                        }
                    }
                }
            };
            loopThroughChildElements(_controls.children);

            var topBar = helper.getChildByClass(_controls, 'zvui-pinch__top-bar');
            if (topBar) {
                loopThroughChildElements(topBar.children);
            }
        };

        ui.init = function () {

            // extend options
            helper.extend(zvuiPinch.options, _defaultUIOptions, true);

            // create local link for fast access
            _options = zvuiPinch.options;

            // find zvui-pinch__ui element
            _controls = helper.getChildByClass(zvuiPinch.scrollWrap, 'zvui-pinch__ui');

            // create local link
            _listen = zvuiPinch.listen;

            _setupHidingControlsDuringGestures();

            // update controls when slides change
            _listen('beforeChange', ui.update);

            // toggle zoom on double-tap
            _listen('doubleTap', function (point) {
                var initialZoomLevel = zvuiPinch.currItem.initialZoomLevel;
                if (zvuiPinch.getZoomLevel() !== initialZoomLevel) {
                    zvuiPinch.zoomTo(initialZoomLevel, point, 333);
                } else {
                    zvuiPinch.zoomTo(_options.getDoubleTapZoom(false, zvuiPinch.currItem), point, 333);
                }
            });

            // Allow text selection in caption
            _listen('preventDragEvent', function (e, isDown, preventObj) {
                var t = e.target || e.srcElement;
                if (t && t.getAttribute('class') && e.type.includes('mouse') && (t.getAttribute('class').indexOf('__caption') > 0 || /(SMALL|STRONG|EM)/i.test(t.tagName))) {
                    preventObj.prevent = false;
                }
            });

            // bind events for UI
            _listen('bindEvents', function () {
                helper.bind(_controls, 'zvuiPinchTap click', _onControlsTap);
                helper.bind(zvuiPinch.scrollWrap, 'zvuiPinchTap', ui.onGlobalTap);

                if (!zvuiPinch.likelyTouchDevice) {
                    helper.bind(zvuiPinch.scrollWrap, 'mouseover', ui.onMouseOver);
                }
            });

            // unbind events for UI
            _listen('unbindEvents', function () {
                if (_idleInterval) {
                    clearInterval(_idleInterval);
                }
                helper.unbind(document, 'mouseout', _onMouseLeaveWindow);
                helper.unbind(document, 'mousemove', _onIdleMouseMove);
                helper.unbind(_controls, 'zvuiPinchTap click', _onControlsTap);
                helper.unbind(zvuiPinch.scrollWrap, 'zvuiPinchTap', ui.onGlobalTap);
                helper.unbind(zvuiPinch.scrollWrap, 'mouseover', ui.onMouseOver);

                if (_fullscrenAPI) {
                    helper.unbind(document, _fullscrenAPI.eventK, ui.updateFullscreen);
                    if (_fullscrenAPI.isFullscreen()) {
                        _options.hideAnimationDuration = 0;
                        _fullscrenAPI.exit();
                    }
                    _fullscrenAPI = null;
                }
            });

            // clean up things when gallery is destroyed
            _listen('destroy', function () {
                if (_options.captionEl) {
                    if (_fakeCaptionContainer) {
                        _controls.removeChild(_fakeCaptionContainer);
                    }
                    helper.removeClass(_captionContainer, 'zvui-pinch__caption--empty');
                }

                helper.removeClass(_controls, 'zvui-pinch__ui--over-close');
                helper.addClass(_controls, 'zvui-pinch__ui--hidden');
                ui.setIdle(false);
            });

            if (!_options.showAnimationDuration) {
                helper.removeClass(_controls, 'zvui-pinch__ui--hidden');
            }
            _listen('initialZoomIn', function () {
                if (_options.showAnimationDuration) {
                    helper.removeClass(_controls, 'zvui-pinch__ui--hidden');
                }
            });
            _listen('initialZoomOut', function () {
                helper.addClass(_controls, 'zvui-pinch__ui--hidden');
            });

            _listen('parseVerticalMargin', _applyNavBarGaps);

            _setupUIElements();

            _countNumItems();

            _setupIdle();

            _setupFullscreenAPI();

            _setupLoadingIndicator();
        };

        ui.setIdle = function (isIdle) {
            _isIdle = isIdle;
            _toggleZvuiPinchClass(_controls, 'ui--idle', isIdle);
        };

        ui.update = function () {
            // Don't update UI if it's hidden
            if (_controlsVisible && zvuiPinch.currItem) {

                ui.updateIndexIndicator();

                if (_options.captionEl) {
                    _options.addCaptionHTMLFn(zvuiPinch.currItem, _captionContainer);

                    _toggleZvuiPinchClass(_captionContainer, 'caption--empty', !zvuiPinch.currItem.title);
                }

                _overlayUIUpdated = true;
            } else {
                _overlayUIUpdated = false;
            }

            _countNumItems();
        };

        ui.updateFullscreen = function (e) {

            if (e) {
                // some browsers change window scroll position during the fullscreen
                // so PhotoSwipe updates it just in case
                setTimeout(function () {
                    zvuiPinch.setScrollOffset(0, helper.getScrollY());
                }, 50);
            }

            // toogle zvui-pinch--fs class on root element
            helper[(_fullscrenAPI.isFullscreen() ? 'add' : 'remove') + 'Class'](zvuiPinch.template, 'zvui-pinch--fs');
        };

        ui.updateIndexIndicator = function () {
            if (_options.counterEl) {
                _indexIndicator.innerHTML = zvuiPinch.getCurrentIndex() + 1 + _options.indexIndicatorSep + _options.getNumItemsFn();
            }
        };

        ui.onGlobalTap = function (e) {
            e = e || window.event;
            var target = e.target || e.srcElement;

            if (_blockControlsTap) {
                return;
            }

            if (e.detail && e.detail.pointerType === 'mouse') {

                // close gallery if clicked outside of the image
                if (_hasCloseClass(target)) {
                    zvuiPinch.close();
                    return;
                }

                if (helper.hasClass(target, 'zvui-pinch__img')) {
                    if (zvuiPinch.getZoomLevel() === 1 && zvuiPinch.getZoomLevel() <= zvuiPinch.currItem.fitRatio) {
                        if (_options.clickToCloseNonZoomable) {
                            zvuiPinch.close();
                        }
                    } else {
                        zvuiPinch.toggleDesktopZoom(e.detail.releasePoint);
                    }
                }
            } else {

                // tap anywhere (except buttons) to toggle visibility of controls
                if (_options.tapToToggleControls) {
                    if (_controlsVisible) {
                        ui.hideControls();
                    } else {
                        ui.showControls();
                    }
                }

                // tap to close gallery
                if (_options.tapToClose && (helper.hasClass(target, 'zvui-pinch__img') || _hasCloseClass(target))) {
                    zvuiPinch.close();
                    return;
                }
            }
        };
        ui.onMouseOver = function (e) {
            e = e || window.event;
            var target = e.target || e.srcElement;

            // add class when mouse is over an element that should close the gallery
            _toggleZvuiPinchClass(_controls, 'ui--over-close', _hasCloseClass(target));
        };

        ui.hideControls = function () {
            helper.addClass(_controls, 'zvui-pinch__ui--hidden');
            _controlsVisible = false;
        };

        ui.showControls = function () {
            _controlsVisible = true;
            if (!_overlayUIUpdated) {
                ui.update();
            }
            helper.removeClass(_controls, 'zvui-pinch__ui--hidden');
        };

        ui.supportsFullscreen = function () {
            var d = document;
            return !!(d.exitFullscreen || d.mozCancelFullScreen || d.webkitExitFullscreen || d.msExitFullscreen);
        };

        ui.getFullscreenAPI = function () {
            var dE = document.documentElement;
            var api = void 0;
            var tF = 'fullscreenchange';

            if (dE.requestFullscreen) {
                api = {
                    enterK: 'requestFullscreen',
                    exitK: 'exitFullscreen',
                    elementK: 'fullscreenElement',
                    eventK: tF
                };
            } else if (dE.mozRequestFullScreen) {
                api = {
                    enterK: 'mozRequestFullScreen',
                    exitK: 'mozCancelFullScreen',
                    elementK: 'mozFullScreenElement',
                    eventK: 'moz' + tF
                };
            } else if (dE.webkitRequestFullscreen) {
                api = {
                    enterK: 'webkitRequestFullscreen',
                    exitK: 'webkitExitFullscreen',
                    elementK: 'webkitFullscreenElement',
                    eventK: 'webkit' + tF
                };
            } else if (dE.msRequestFullscreen) {
                api = {
                    enterK: 'msRequestFullscreen',
                    exitK: 'msExitFullscreen',
                    elementK: 'msFullscreenElement',
                    eventK: 'MSFullscreenChange'
                };
            }

            if (api) {
                api.enter = function () {
                    // disable close-on-scroll in fullscreen
                    _initalCloseOnScrollValue = _options.closeOnScroll;
                    _options.closeOnScroll = false;

                    if (this.enterK === 'webkitRequestFullscreen') {
                        zvuiPinch.template[this.enterK](Element.ALLOW_KEYBOARD_INPUT);
                    } else {
                        return zvuiPinch.template[this.enterK]();
                    }
                };
                api.exit = function () {
                    _options.closeOnScroll = _initalCloseOnScrollValue;

                    return document[this.exitK]();
                };
                api.isFullscreen = function () {
                    return document[this.elementK];
                };
            }

            return api;
        };
    };
});