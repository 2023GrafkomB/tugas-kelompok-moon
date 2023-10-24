(function (context, factory) {
  if (typeof define === "function" && define.amd) {
    define(factory);
  } else {
    context.k = context.KeyboardJS = factory();
  }
})(this, function () {
  function bind(target, type, handler) {
    if (target.addEventListener) {
      target.addEventListener(type, handler, false);
    } else {
      target.attachEvent("on" + type, function (event) {
        return handler.call(target, event);
      });
    }
  }

  [].indexOf ||
    (Array.prototype.indexOf = function (a, b, c) {
      for (
        c = this.length, b = (c + ~~b) % c;
        b < c && (!(b in this) || this[b] !== a);
        b++
      );
      return b ^ c ? b : -1;
    });

  var locals = {
    us: {
      space: 32,
      pageup: 33,
      pagedown: 34,
      end: 35,
      home: 36,
      left: 37,
      up: 38,
      right: 39,
      down: 40,
    },
  };

  //keys
  var keys = locals["us"];
  var activeKeys = [];
  var activeBindings = {};
  var keyBindingGroups = [];

  bind(document, "keydown", function (event) {
    for (var key in keys) {
      if (keys.hasOwnProperty(key) && event.keyCode === keys[key]) {
        if (activeKeys.indexOf(key) < 0) {
          activeKeys.push(key);
        }
      }
    }
    return executeActiveKeyBindings(event);
  });

  bind(document, "keyup", function (event) {
    for (var key in keys) {
      if (keys.hasOwnProperty(key) && event.keyCode === keys[key]) {
        var iAK = activeKeys.indexOf(key);
        if (iAK > -1) {
          activeKeys.splice(iAK, 1);
        }
      }
    }
    return pruneActiveKeyBindings(event);
  });

  bind(window, "blur", function () {
    activeKeys = [];
    return pruneActiveKeyBindings(event);
  });

  function queryActiveBindings() {
    var bindingStack = [];
    for (var keyCount = keyBindingGroups.length; keyCount > -1; keyCount -= 1) {
      if (keyBindingGroups[keyCount]) {
        var KeyBindingGroup = keyBindingGroups[keyCount];
        for (
          var bindingIndex = 0;
          bindingIndex < KeyBindingGroup.length;
          bindingIndex += 1
        ) {
          var binding = KeyBindingGroup[bindingIndex];
          var keyBindingActive = true;
          for (
            var keyIndex = 0;
            keyIndex < binding.keys.length;
            keyIndex += 1
          ) {
            var key = binding.keys[keyIndex];
            if (activeKeys.indexOf(key) < 0) {
              keyBindingActive = false;
            }
          }
          if (keyBindingActive) {
            bindingStack.push(binding);
          }
        }
      }
    }
    return bindingStack;
  }

  function executeActiveKeyBindings(event) {
    if (activeKeys < 1) {
      return true;
    }
    var bindingStack = queryActiveBindings();
    var spentKeys = [];
    var output;
    for (
      var bindingIndex = 0;
      bindingIndex < bindingStack.length;
      bindingIndex += 1
    ) {
      var binding = bindingStack[bindingIndex];
      var usesSpentKey = false;
      for (var keyIndex = 0; keyIndex < binding.keys.length; keyIndex += 1) {
        var key = binding.keys[keyIndex];
        if (spentKeys.indexOf(key) > -1) {
          usesSpentKey = true;
          break;
        }
      }
      if (!usesSpentKey) {
        if (typeof binding.callback === "function") {
          if (!binding.callback(event, binding.keys, binding.keyCombo)) {
            output = false;
          }
        }
        if (!activeBindings[binding.keyCombo]) {
          activeBindings[binding.keyCombo] = binding;
        }
        for (var keyIndex = 0; keyIndex < binding.keys.length; keyIndex += 1) {
          var key = binding.keys[keyIndex];
          if (spentKeys.indexOf(key) < 0) {
            spentKeys.push(key);
          }
        }
      }
    }
    if (spentKeys.length) {
      return false;
    }
    return output;
  }

  function pruneActiveKeyBindings(event) {
    var bindingStack = queryActiveBindings();
    var output;
    for (var bindingCombo in activeBindings) {
      if (activeBindings.hasOwnProperty(bindingCombo)) {
        var binding = activeBindings[bindingCombo];
        var active = false;
        for (
          var bindingIndex = 0;
          bindingIndex < bindingStack.length;
          bindingIndex += 1
        ) {
          var activeCombo = bindingStack[bindingIndex].keyCombo;
          if (activeCombo === bindingCombo) {
            active = true;
            break;
          }
        }
        if (!active) {
          if (typeof binding.endCallback === "function") {
            if (!binding.endCallback(event, binding.keys, binding.keyCombo)) {
              output = false;
            }
          }
          delete activeBindings[bindingCombo];
        }
      }
    }
    return output;
  }

  function bindKey(keyCombo, callback, endCallback) {
    function clear() {
      if (keys && keys.length) {
        var keyBindingGroup = keyBindingGroups[keys.length];
        if (keyBindingGroup.indexOf(keyBinding) > -1) {
          var index = keyBindingGroups[keys.length].indexOf(keyBinding);
          keyBindingGroups[keys.length].splice(index, 1);
        }
      }
    }
    var bindSets = keyCombo.toLowerCase().replace(/\s/g, "").split(",");
    for (var i = 0; i < bindSets.length; i += 1) {
      var keys = bindSets[i].split("+");
      if (keys.length) {
        if (!keyBindingGroups[keys.length]) {
          keyBindingGroups[keys.length] = [];
        }
        var keyBinding = {
          callback: callback,
          endCallback: endCallback,
          keyCombo: bindSets[i],
          keys: keys,
        };
        keyBindingGroups[keys.length].push(keyBinding);
      }
    }
    return {
      clear: clear,
    };
  }

  function bindAxis(up, down, left, right, callback) {
    function clear() {
      if (typeof clearUp === "function") {
        clearUp();
      }
      if (typeof clearDown === "function") {
        clearDown();
      }
      if (typeof clearLeft === "function") {
        clearLeft();
      }
      if (typeof clearRight === "function") {
        clearRight();
      }
      if (typeof timer === "function") {
        clearInterval(timer);
      }
    }
    var axis = [0, 0];
    if (typeof callback !== "function") {
      return false;
    }
    var clearUp = bindKey(
      up,
      function () {
        if (axis[0] === 0) {
          axis[0] = -1;
        }
      },
      function () {
        axis[0] = 0;
      }
    ).clear;
    var clearDown = bindKey(
      down,
      function () {
        if (axis[0] === 0) {
          axis[0] = 1;
        }
      },
      function () {
        axis[0] = 0;
      }
    ).clear;
    var clearLeft = bindKey(
      left,
      function () {
        if (axis[1] === 0) {
          axis[1] = -1;
        }
      },
      function () {
        axis[1] = 0;
      }
    ).clear;
    var clearRight = bindKey(
      right,
      function () {
        if (axis[1] === 0) {
          axis[1] = 1;
        }
      },
      function () {
        axis[1] = 0;
      }
    ).clear;
    var timer = setInterval(function () {
      if (axis[0] === 0 && axis[1] === 0) {
        return;
      }
      callback(axis);
    }, 1);
    return {
      clear: clear,
    };
  }

  function unbindKey(keys) {
    if (keys === "all") {
      keyBindingGroups = [];
      return;
    }
    keys = keys.replace(/\s/g, "").split(",");
    for (var iKCL = keyBindingGroups.length; iKCL > -1; iKCL -= 1) {
      if (keyBindingGroups[iKCL]) {
        var KeyBindingGroup = keyBindingGroups[iKCL];
        for (var iB = 0; iB < KeyBindingGroup.length; iB += 1) {
          var keyBinding = KeyBindingGroup[iB];
          var remove = false;
          for (var iKB = 0; iKB < keyBinding.keys.length; iKB += 1) {
            var key = keyBinding.keys[iKB];
            for (var iKR = 0; iKR < keys.length; iKR += 1) {
              var keyToRemove = keys[iKR];
              if (keyToRemove === key) {
                remove = true;
                break;
              }
            }
            if (remove) {
              break;
            }
          }
          if (remove) {
            keyBindingGroups[iKCL].splice(iB, 1);
            iB -= 1;
            if (keyBindingGroups[iKCL].length < 1) {
              delete keyBindingGroups[iKCL];
            }
          }
        }
      }
    }
  }

  function getActiveKeys() {
    return activeKeys;
  }

  function addLocale(local, keys) {
    locals[local] = keys;
  }

  function setLocale(local) {
    if (locals[local]) {
      keys = locals[local];
    }
  }

  return {
    bind: {
      key: bindKey,
      axis: bindAxis,
    },
    activeKeys: getActiveKeys,
    unbind: {
      key: unbindKey,
    },
    locale: {
      add: addLocale,
      set: setLocale,
    },
  };
});
