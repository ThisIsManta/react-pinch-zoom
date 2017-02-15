'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

require('./lib/main.css');

require('./style.css');

var _photoswipe = require('./lib/photoswipe.js');

var _photoswipe2 = _interopRequireDefault(_photoswipe);

var _photoswipeUiDefault = require('./lib/photoswipe-ui-default.js');

var _photoswipeUiDefault2 = _interopRequireDefault(_photoswipeUiDefault);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var noop = function noop() {};

var PinchZoom = function (_React$Component) {
  _inherits(PinchZoom, _React$Component);

  function PinchZoom(props) {
    _classCallCheck(this, PinchZoom);

    var _this = _possibleConstructorReturn(this, (PinchZoom.__proto__ || Object.getPrototypeOf(PinchZoom)).call(this, props));

    _this.onZoomStart = function () {
      _this.formerZoomRatio = _this.zvuiPinch.getZoomLevel();

      _this.props.onZoomStart(_this.formerZoomRatio);
    };

    _this.onZoomEnd = function () {
      var currentZoomRatio = _this.zvuiPinch.getZoomLevel();

      if (_this.formerZoomRatio < currentZoomRatio) {
        _this.props.onZoomIn(currentZoomRatio);
      } else {
        _this.props.onZoomOut(currentZoomRatio);
      }

      _this.props.onZoomEnd(currentZoomRatio);

      if (_this.initialZoomRatio >= currentZoomRatio || Math.abs(_this.initialZoomRatio - currentZoomRatio) < 0.01) {
        _this.props.onZoomReset(currentZoomRatio);
      }
    };

    _this.state = {};
    return _this;
  }

  _createClass(PinchZoom, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      var _this2 = this;

      this.zvuiPinch = new _photoswipe2.default(this.element, _photoswipeUiDefault2.default, this.props.items, {
        // See http://photoswipe.com/documentation/options.html
        index: this.props.selectedIndex >= 0 ? this.props.selectedIndex : 0,
        pinchToClose: false,
        tapToClose: false,
        loop: false
      });

      this.zvuiPinch.listen('beforeChange', function () {
        _this2.props.onSelectedIndexChange(_this2.zvuiPinch.getCurrentIndex());
      });

      this.zvuiPinch.listen('afterChange', function () {
        _this2.initialZoomRatio = _this2.zvuiPinch.getZoomLevel();
      });

      this.zvuiPinch.listen('zoomGestureStarted', function () {
        _this2.onZoomStart();
      });

      this.zvuiPinch.listen('zoomGestureEnded', function () {
        _this2.onZoomEnd();
      });

      this.zvuiPinch.listen('doubleTap', function () {
        _this2.onZoomStart();

        // Wait until the zooming animation end then trigger `onZoomEnd` event
        // Note that the double-tap delay is 300 ms, so we need to wait 400 ms
        // See https://github.com/sylvesteraswin/react-pinch-zoom/blob/master/lib/photoswipe.js#L3287
        setTimeout(function () {
          if (!_this2._unmounting) {
            _this2.onZoomEnd();
          }
        }, 400);
      });

      this.zvuiPinch.listen('destroy', function () {
        if (!_this2._unmounting) {
          _this2.props.onClose();
        }
      });

      this.zvuiPinch.init();

      this.initialZoomRatio = this.zvuiPinch.getZoomLevel();
    }
  }, {
    key: 'shouldComponentUpdate',
    value: function shouldComponentUpdate() {
      // Do not re-render the component in any circumstances
      return false;
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      this._unmounting = true;

      if (this.zvuiPinch) {
        this.zvuiPinch.close();
      }
    }
  }, {
    key: 'render',
    value: function render() {
      var _this3 = this;

      // Do not modify this line
      var BASE_CLASS = 'zvui-pinch';

      return _react2.default.createElement(
        'div',
        { className: '' + BASE_CLASS, tabIndex: '-1', role: 'dialog', ref: function ref(e) {
            _this3.element = e;
          } },
        _react2.default.createElement('div', { className: BASE_CLASS + '__bg' }),
        _react2.default.createElement(
          'div',
          { className: BASE_CLASS + '__scroll-wrap' },
          _react2.default.createElement(
            'div',
            { className: BASE_CLASS + '__container' },
            _react2.default.createElement('div', { className: BASE_CLASS + '__item' }),
            _react2.default.createElement('div', { className: BASE_CLASS + '__item' }),
            _react2.default.createElement('div', { className: BASE_CLASS + '__item' })
          ),
          _react2.default.createElement(
            'div',
            { className: BASE_CLASS + '__ui ' + BASE_CLASS + '__ui--hidden' },
            _react2.default.createElement(
              'div',
              { className: BASE_CLASS + '__top-bar' },
              _react2.default.createElement('div', { className: BASE_CLASS + '__counter' }),
              _react2.default.createElement('button', { className: BASE_CLASS + '__button ' + BASE_CLASS + '__button--close' }),
              _react2.default.createElement('div', { className: BASE_CLASS + '__preloader' })
            )
          )
        )
      );
    }
  }]);

  return PinchZoom;
}(_react2.default.Component);

PinchZoom.propTypes = {
  items: _react2.default.PropTypes.arrayOf(_react2.default.PropTypes.shape({
    src: _react2.default.PropTypes.string,
    w: _react2.default.PropTypes.number,
    h: _react2.default.PropTypes.number
  })).isRequired,
  selectedIndex: _react2.default.PropTypes.number.isRequired,
  onSelectedIndexChange: _react2.default.PropTypes.func,
  onZoomStart: _react2.default.PropTypes.func,
  onZoomEnd: _react2.default.PropTypes.func,
  onZoomIn: _react2.default.PropTypes.func,
  onZoomOut: _react2.default.PropTypes.func,
  onZoomReset: _react2.default.PropTypes.func,
  onClose: _react2.default.PropTypes.func.isRequired
};
PinchZoom.defaultProps = {
  onSelectedIndexChange: noop,
  onZoomStart: noop,
  onZoomEnd: noop,
  onZoomIn: noop,
  onZoomOut: noop,
  onZoomReset: noop
};
exports.default = PinchZoom;