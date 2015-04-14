/**
 * Diff-Engine - A content to timestamped diff codec.
 * @version v0.1.1
 * @license MIT
 */

/*!
 * Diff Engine
 * 
 * Released under the MIT license
 * 
 */

(function( global, factory ) {

  if ( typeof module === "object" && typeof module.exports === "object" ) {
    // For CommonJS and CommonJS-like environments where a proper `window`
    // is present, execute the factory and get jQuery.
    // For environments that do not have a `window` with a `document`
    // (such as Node.js), expose a factory as module.exports.
    // This accentuates the need for the creation of a real `window`.
    // e.g. var jQuery = require("jquery")(window);
    // See ticket #14549 for more info.
    module.exports = global.document ?
      factory( global, true ) :
      function( w ) {
        if ( !w.document ) {
          throw new Error( "jQuery requires a window with a document" );
        }
        return factory( w );
      };
  } else {
    factory( global );
  }

// Pass this if window is not defined yet
}(typeof window !== "undefined" ? window : this, function( window, noGlobal ) {

  var _diffArr = [];
  var _prevStateStr = JSON.stringify({});
  var _prevDate;

  var _history = [];
  
  var _diffAndHistoryOutOfSync = true;

  function Encoder() {
    /**
         * Calculates the diff from the state and adds it to the diff list
         * @param  {string} state - the state to be diffed
         */
    this.push = function(state) {
      var diff = _generateDiff(state);
      _diffArr.push(diff);
      _diffAndHistoryOutOfSync = true;
      return _diffArr.length - 1;
    };

    /** Converts a state object into a diff object */
    function _generateDiff (_state) {
      var _diff = {
        ops: []
      };
      var _rawDiffOps;
      var _now = Date.now();

      var _stateStr = JSON.stringify(_state);

      if (_prevStateStr === '{}') {
        // console.log('FIRST');
        _diff.ta = _now;
      } else {
        _diff.tr = _now - _prevDate;
      }

      if (_stateStr) {
        _rawDiffOps = window.JsDiff.diffChars(_prevStateStr, _stateStr);
      }

      _rawDiffOps.forEach(function(diff) {
        var d = {};
        if (!diff.added && !diff.removed) {
          d.$ = diff.count;
        } else if (diff.removed) {
          d.r = diff.count;
        } else {
          d.a = diff.value;
        }
        _diff.ops.push(d);
      });

      _prevStateStr = _stateStr;
      _prevDate = _now;

      return _diff;
    }
  }

  function Decoder() {
    
    /**
     * Get the diff array
     * @return {array} An array of diff objects
     */
    this.getDiffs = function() {
      return _diffArr;
    };

    /**
     * Return the state after ALL diffs
     * @return {object}  The state object after the diffs are decoded
     */
    this.getState = function(time) {
      if (time === undefined) {
        return _decodeState();
      } else {
        return this._getStateAtTime(time);
      }
    };
    
    /**
     * Get the state at dif # num
     * @param  {integer} num - the number of the diff to be decoded
     * @return {string}        the decoded state
     */
    this.getStateAtIndex = function(num) {
      if (num > _diffArr.length - 1) {
        return null;
      }

      return _decodeState(num);
    };

    /**
     * Get the state at a given time
     * @param  {integer} time - ms from start to be decoded
     * @return {string}        the decoded state
     */
    this._getStateAtTime = function(time) {
      // ensure we have a state history to search through
      _decodeState();

      // search through the state history for the closest 
      // state object before or at the time
      for (var i = 0; i < _diffArr.length; i++) {
        if (_history[i + 1] && _history[i + 1].timestamp > time) {
          break;
        }
      }
      
      // return the state we found, or the final one
      return _history[i] || _history[_history.length - 1];
    };

    /**
     * Get a timeline of decoded state
     * @return {array} timeline of decoded state
     */
    this.getStateTimeline = function() {
      if (_diffArr.length !== _history.length) {
        _decodeState();
      }
      return _history;
    };

    /**
     * reconstruct a state timeline based on the diffs, and return a state object
     * @param  {[number]} _num - optional index to decode and return (if omitted, returns the final state)
     * @return {[type]}      [state]
     */
    function _decodeState (_num) {
      
      if (_num === undefined) {
        _num = _diffArr.length - 1;
      }

      if (_diffArr.length === _history.length && !_diffAndHistoryOutOfSync) {
        return _history[_num];
      }

      // reset stateHistory, calculate everything from scratch
      _history = [];

      // console.log('decoding');
      
      // go through the diff array
      _diffArr.forEach(function(_diff, _diffNum) {
        var timestampAbs, timestamp;

        // our virtual cursor
        var i = 0;

        // last string value or ''
        var stateStr = _history[_diffNum - 1] && JSON.stringify(_history[_diffNum - 1].state) || '{}';

        // run through each diff and calculate state
        _diff.ops.forEach(function(diffOp) {
          if (diffOp.a) {
            // console.debug('ADDED ' + diffOp.a);
            stateStr = stateStr.substr(0, i) + diffOp.a + stateStr.slice(i);
            i += diffOp.a.length;
          } else if (diffOp.r) {
            // console.debug('REMOVED ' + stateStr.substr(i, diffOp.r));
            stateStr = stateStr.substr(0, i) + stateStr.slice(i + diffOp.r);
          } else {
            i += diffOp.$;
          }
        });

        // set the timestamps
        if (_diff.ta) {
          timestampAbs = _diff.ta;
          timestamp = 0;
        } else {
          timestampAbs = _history[_diffNum - 1].timestampAbs + _diff.tr;
          timestamp = _history[_diffNum - 1].timestamp + _diff.tr;
        }

        _history.push({
          state: JSON.parse(stateStr),
          timestamp: timestamp,
          timestampAbs: timestampAbs,
          index: _history.length
        });

        // console.log(_history[_diffNum] && _history[_diffNum].state, _history[_diffNum]);

      });
      
      _diffAndHistoryOutOfSync = false;
      // console.log(_history[_num]);
      return _history[_num];
    }

  }

  function DiffEngine () {
    this.encoder = new Encoder();
    this.decoder = new Decoder();
  }

  DiffEngine.prototype.getEncoder = function() {
    return this.encoder;
  };
  DiffEngine.prototype.getDecoder = function() {
    return this.decoder;
  };

  window.diffEngine = function() {
    return new DiffEngine();
  };

}));
