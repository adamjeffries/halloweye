// https://codepen.io/fta/pen/rNZrXp

var $, applyTransform, getTransform, makeTransformable;

$ = jQuery;

getTransform = function (from, to) {
  var A, H, b, h, i, k, k_i, l, lhs, m, ref, rhs;
  console.assert(from.length === (ref = to.length) && ref === 4);
  A = []; // 8x8
  for (i = k = 0; k < 4; i = ++k) {
    A.push([
      from[i].x,
      from[i].y,
      1,
      0,
      0,
      0,
      -from[i].x * to[i].x,
      -from[i].y * to[i].x,
    ]);
    A.push([
      0,
      0,
      0,
      from[i].x,
      from[i].y,
      1,
      -from[i].x * to[i].y,
      -from[i].y * to[i].y,
    ]);
  }
  b = []; // 8x1
  for (i = l = 0; l < 4; i = ++l) {
    b.push(to[i].x);
    b.push(to[i].y);
  }
  // Solve A * h = b for h
  h = numeric.solve(A, b);
  H = [
    [h[0], h[1], 0, h[2]],
    [h[3], h[4], 0, h[5]],
    [0, 0, 1, 0],
    [h[6], h[7], 0, 1],
  ];
  // Sanity check that H actually maps `from` to `to`
  for (i = m = 0; m < 4; i = ++m) {
    lhs = numeric.dot(H, [from[i].x, from[i].y, 0, 1]);
    k_i = lhs[3];
    rhs = numeric.dot(k_i, [to[i].x, to[i].y, 0, 1]);
    console.assert(
      numeric.norm2(numeric.sub(lhs, rhs)) < 1e-9,
      "Not equal:",
      lhs,
      rhs
    );
  }
  return H;
};

applyTransform = function (element, originalPos, targetPos, callback) {
  var H, from, i, j, p, to;
  // All offsets were calculated relative to the document
  // Make them relative to (0, 0) of the element instead
  from = (function () {
    var k, len, results;
    results = [];
    for (k = 0, len = originalPos.length; k < len; k++) {
      p = originalPos[k];
      results.push({
        x: p[0] - originalPos[0][0],
        y: p[1] - originalPos[0][1],
      });
    }
    return results;
  })();
  to = (function () {
    var k, len, results;
    results = [];
    for (k = 0, len = targetPos.length; k < len; k++) {
      p = targetPos[k];
      results.push({
        x: p[0] - originalPos[0][0],
        y: p[1] - originalPos[0][1],
      });
    }
    return results;
  })();
  // Solve for the transform
  H = getTransform(from, to);

  // Apply the matrix3d as H transposed because matrix3d is column major order
  // Also need use toFixed because css doesn't allow scientific notation
  $(element).css({
    transform: `matrix3d(${(function () {
      var k, results;
      results = [];
      for (i = k = 0; k < 4; i = ++k) {
        results.push(
          (function () {
            var l, results1;
            results1 = [];
            for (j = l = 0; l < 4; j = ++l) {
              results1.push(H[j][i].toFixed(20));
            }
            return results1;
          })()
        );
      }
      return results;
    })().join(",")})`,
    "transform-origin": "0 0",
  });
  return typeof callback === "function" ? callback(element, H) : void 0;
};

makeTransformable = function (selector, callback) {
  return $(selector).each(function (i, element) {
    console.log("selector", selector);
    var controlPoints, originalPos, p, position;
    $(element).css("transform", "");

    // Add four dots to corners of `element` as control points
    controlPoints = (function () {
      var k, len, ref, results;
      ref = ["left top", "left bottom", "right top", "right bottom"];
      results = [];
      for (k = 0, len = ref.length; k < len; k++) {
        position = ref[k];
        results.push(
          $("<div>")
            .css({
              border: "10px solid #444",
              borderRadius: "10px",
              cursor: "move",
              position: "absolute",
              zIndex: 100000,
            })
            .appendTo("body")
            .position({
              at: position,
              of: element,
              collision: "none",
            })
        );
      }
      return results;
    })();
    console.log("controlPoints", controlPoints);
    // Record the original positions of the dots
    originalPos = (function () {
      var k, len, results;
      results = [];
      for (k = 0, len = controlPoints.length; k < len; k++) {
        p = controlPoints[k];
        results.push([p.offset().left, p.offset().top]);
      }
      return results;
    })();

    // Transform `element` to match the new positions of the dots whenever dragged
    $(controlPoints).draggable({
      start: () => {
        return $(element).css("pointer-events", "none"); // makes dragging around iframes easier
      },
      drag: () => {
        return applyTransform(
          element,
          originalPos,
          (function () {
            var k, len, results;
            results = [];
            for (k = 0, len = controlPoints.length; k < len; k++) {
              p = controlPoints[k];
              results.push([p.offset().left, p.offset().top]);
            }
            return results;
          })(),
          callback
        );
      },
      stop: () => {
        applyTransform(
          element,
          originalPos,
          (function () {
            var k, len, results;
            results = [];
            for (k = 0, len = controlPoints.length; k < len; k++) {
              p = controlPoints[k];
              results.push([p.offset().left, p.offset().top]);
            }
            return results;
          })(),
          callback
        );
        return $(element).css("pointer-events", "auto");
      },
    });
    return element;
  });
};

makeTransformable("#main", function (element, H) {
  var i, j;
  // console.log($(element).css("transform"));
  // return $(element).html(
  //   $("<table style='color:white;'>")
  //     .append($("<tr>").html($("<td>").text("matrix3d(")))
  //     .append(
  //       (function () {
  //         var k, results;
  //         results = [];
  //         for (i = k = 0; k < 4; i = ++k) {
  //           results.push(
  //             $("<tr>").append(
  //               (function () {
  //                 var l, results1;
  //                 results1 = [];
  //                 for (j = l = 0; l < 4; j = ++l) {
  //                   results1.push(
  //                     $("<td>").text(H[j][i] + (i === j && j === 3 ? "" : ","))
  //                   );
  //                 }
  //                 return results1;
  //               })()
  //             )
  //           );
  //         }
  //         return results;
  //       })()
  //     )
  //     .append($("<tr>").html($("<td>").text(")")))
  // );
});

// Animation
class Animation {
  constructor(id) {
    this.$el = document.getElementById(id);
  }
  animate(property, value, duration = 0) {
    return new Promise((resolve) => {
      this.$el.style[property] = value;
      this.$el.style.transitionDuration = duration + "ms";
      if (!duration) return resolve();
      setTimeout(() => resolve(), duration);
    });
  }
  color(duration = 0, color = "#000") {
    return this.animate("background-color", color, duration);
  }
  hide(duration = 0) {
    return this.animate("opacity", "0", duration);
  }
  rotate(duration = 0, deg = 0) {
    return this.animate("transform", `rotate(${deg}deg)`, duration);
  }
  show(duration = 0) {
    return this.animate("opacity", "1", duration);
  }
}

const all = (...promises) => Promise.all(promises);

const animations = {
  bg: new Animation("bg"),
  creepy: new Animation("creepy"),
  eye: new Animation("eyeball"),
  pumpkin: new Animation("pumpkin"),
  pumpkinBG: new Animation("bg-pumpkin"),
  pumpkinLE: new Animation("pumpkin-eye-left"),
  pumpkinRE: new Animation("pumpkin-eye-right"),
};

const sequence = [
  [
    ["bg", "color", "black"],
    ["eye", "show", 1000],
    ["creepy", "hide"],
    ["pumpkin", "hide"],
    ["pumpkinBG", "hide"],
    ["pumpkinLE", "hide"],
    ["pumpkinRE", "hide"],
  ],
  [["eye", "rotate", 2000, 25]],
  [["eye", "rotate", 2000, -25]],
  [["eye", "rotate", 500, 25]],
  [["eye", "rotate", 2000, 20]],
  [["eye", "rotate", 2000, -25]],
  [["eye", "rotate", 2000, 25]],
  [["eye", "rotate", 500, 135]],
  [["eye", "rotate", 2000, 140]],
  [["eye", "rotate", 500, 225]],
  [["eye", "rotate", 2000, 230]],
  [["eye", "rotate", 500, 360]],
  [
    ["eye", "rotate", 0, 0],
    ["creepy", "show", 1000],
  ],
  [
    ["bg", "show"],
    ["bg", "color", 0, "orange"],
    ["eye", "hide", 1000],
  ],
  [["bg", "color", 500, "orange"]],
  [["bg", "color", 0, "black"]],
  [["bg", "color", 1000, "black"]],
  [["bg", "color", 0, "black"]],
  [["bg", "color", 1000, "orange"]],
  [
    ["eye", "show", 1000],
    ["bg", "color", 1000, "black"],
  ],
  [
    ["eye", "rotate", 2000, 25],
    ["creepy", "hide", 2000],
  ],
  [["eye", "rotate", 2000, 25]],
  [["eye", "rotate", 2000, 45]],
  [["eye", "rotate", 500, 25]],
  [["eye", "rotate", 2000, 20]],
  [["eye", "rotate", 500, -25]],
  [["eye", "rotate", 2000, -30]],
  [
    ["eye", "hide", 2000],
    ["pumpkin", "show", 2000],
  ],
  [
    ["pumpkinBG", "show", 2000],
    ["pumpkinBG", "color", 1000, "orange"],
  ],
  [["pumpkinBG", "color", 1000, "yellow"]],
  [
    ["pumpkinLE", "show", 500],
    ["pumpkinRE", "show", 500],
  ],
  [["pumpkinBG", "show", 1000]],
  [
    ["pumpkinLE", "rotate", 2000, 25],
    ["pumpkinRE", "rotate", 2000, 25],
  ],
  [
    ["pumpkinLE", "rotate", 2000, 25],
    ["pumpkinRE", "rotate", 2000, 25],
    ["pumpkinBG", "color", 2000, "orange"],
  ],
  [
    ["pumpkinLE", "rotate", 500, -25],
    ["pumpkinRE", "rotate", 500, -25],
  ],
  [
    ["pumpkinLE", "rotate", 2000, -25],
    ["pumpkinRE", "rotate", 2000, -25],
    ["pumpkinBG", "color", 2000, "yellow"],
  ],
  [
    ["pumpkinLE", "rotate", 1000, 0],
    ["pumpkinRE", "rotate", 1000, 0],
  ],
  [
    ["pumpkinLE", "rotate", 1000, -75],
    ["pumpkinRE", "rotate", 1000, 75],
  ],
  [
    ["pumpkinLE", "rotate", 2000, -75],
    ["pumpkinRE", "rotate", 2000, 75],
    ["pumpkinBG", "color", 2000, "black"],
  ],
  [
    ["pumpkinLE", "hide", 2000],
    ["pumpkinRE", "hide", 2000],
    ["pumpkinBG", "hide", 2000],
  ],
  [["pumpkinBG", "hide", 2000]],
];

const loop = async () => {
  for (let i = 0; i < sequence.length; i++) {
    await Promise.all(
      sequence[i].map((item) => {
        const [animation, method, ...args] = item;
        return animations[animation][method](...args);
      })
    );
  }
  requestAnimationFrame(loop);
};
loop();
