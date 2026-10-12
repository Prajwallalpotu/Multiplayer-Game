import { useEffect, useRef } from "react";
import {
  HOTSPOTS,
  LOCATIONS,
  entrances,
  ROLES,
  type GameView,
  type LocationId,
} from "../shared/world";
const W = 1200,
  H = 800;
function polygon(
  c: CanvasRenderingContext2D,
  pts: number[][],
  fill: string,
  stroke?: string,
) {
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fillStyle = fill;
  c.fill();
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = 1;
    c.stroke();
  }
}
function line(
  c: CanvasRenderingContext2D,
  pts: number[][],
  color: string,
  width = 1,
) {
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
}
function light(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color = "218,174,97",
  alpha = 0.2,
) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${color},${alpha})`);
  g.addColorStop(1, `rgba(${color},0)`);
  c.fillStyle = g;
  c.fillRect(x - r, y - r, r * 2, r * 2);
}
function tree(c: CanvasRenderingContext2D, x: number, y: number, s = 1) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.fillStyle = "#0a171a";
  c.fillRect(-3, -45, 6, 51);
  for (let k = 0; k < 4; k++)
    polygon(
      c,
      [
        [-31 + k * 4, -20 - k * 17],
        [0, -78 - k * 8],
        [31 - k * 4, -20 - k * 17],
      ],
      k % 2 ? "#142729" : "#102123",
    );
  c.restore();
}
function house(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  clock = false,
  dawn = false,
) {
  const d = w * 0.31,
    r = h * 0.42;
  c.save();
  c.translate(x, y);
  polygon(
    c,
    [
      [0, 0],
      [w, 18],
      [w + d, -d + 18],
      [d, -d],
    ],
    "#0a1517",
  );
  polygon(
    c,
    [
      [0, 0],
      [w, 18],
      [w, 18 - h],
      [0, -h],
    ],
    dawn ? "#59615a" : "#293c3d",
    "#405252",
  );
  polygon(
    c,
    [
      [w, 18],
      [w + d, -d + 18],
      [w + d, -d + 18 - h],
      [w, 18 - h],
    ],
    dawn ? "#3c4c46" : "#1c3032",
  );
  polygon(
    c,
    [
      [-9, -h],
      [w + 8, 18 - h],
      [w / 2 + 5, -h - r],
    ],
    "#152629",
    "#526363",
  );
  polygon(
    c,
    [
      [w + 8, 18 - h],
      [w + d + 10, -d + 18 - h],
      [w / 2 + d, -h - r - d],
      [w / 2 + 5, -h - r],
    ],
    "#1c3033",
    "#425457",
  );
  for (let j = 0; j < 7; j++)
    line(
      c,
      [
        [w / 2 + 5 + j * 5, -h - r + j * 4],
        [w + 8 + j * 4, 18 - h - j * 4],
      ],
      "#2b4143",
      1,
    );
  c.fillStyle = "#18292a";
  c.fillRect(w * 0.69, -h - r * 0.73, 13, 29);
  c.fillStyle = "#52605a";
  c.fillRect(w * 0.69 - 2, -h - r * 0.73, 17, 5);
  for (let i = 0; i < 3; i++) {
    let wx = 16 + (i * (w - 35)) / 3,
      wy = -h * 0.64 + i * 2;
    light(c, wx + 8, wy + 10, 44, "237,179,96", 0.08);
    c.fillStyle = "#101f22";
    c.fillRect(wx - 3, wy - 3, 23, 30);
    c.fillStyle = i === 1 ? "#788676" : "#c49a5d";
    c.fillRect(wx, wy, 17, 23);
    line(
      c,
      [
        [wx + 8, wy],
        [wx + 8, wy + 23],
      ],
      "#36403a",
      2,
    );
    line(
      c,
      [
        [wx, wy + 12],
        [wx + 17, wy + 12],
      ],
      "#36403a",
      2,
    );
  }
  c.fillStyle = "#132627";
  c.fillRect(w * 0.43, -42, w * 0.18, 48);
  c.fillStyle = "#8f7953";
  c.fillRect(w * 0.43 + 3, -39, w * 0.18 - 6, 42);
  c.fillStyle = "#d7b67e";
  c.fillRect(w * 0.56, -18, 3, 3);
  if (label) {
    c.fillStyle = "#102124";
    c.fillRect(5, -h * 0.26, w - 10, 19);
    c.fillStyle = "#c6bc9e";
    c.textAlign = "center";
    c.font = "8px monospace";
    c.fillText(label.toUpperCase(), w / 2, -h * 0.26 + 12);
  }
  if (clock) {
    c.fillStyle = "#374d4a";
    c.fillRect(w * 0.3, -h - r - 79, w * 0.4, 99);
    polygon(
      c,
      [
        [w * 0.25, -h - r - 79],
        [w * 0.5, -h - r - 123],
        [w * 0.75, -h - r - 79],
      ],
      "#14272b",
      "#556461",
    );
    c.fillStyle = "#c5c09b";
    c.beginPath();
    c.arc(w * 0.5, -h - r - 48, 18, 0, Math.PI * 2);
    c.fill();
    line(
      c,
      [
        [w * 0.5 - 4, -h - r - 64],
        [w * 0.5, -h - r - 48],
        [w * 0.5, -h - r - 48 + (dawn ? 11 : -10)],
      ],
      "#253a3b",
      2,
    );
  }
  c.restore();
}
function lamp(c: CanvasRenderingContext2D, x: number, y: number) {
  line(
    c,
    [
      [x, y],
      [x, y - 81],
      [x + 18, y - 81],
    ],
    "#101d1f",
    5,
  );
  c.fillStyle = "#cdb277";
  c.fillRect(x + 12, y - 84, 13, 8);
  light(c, x + 18, y - 75, 90, "228,185,112", 0.22);
  polygon(
    c,
    [
      [x + 12, y - 78],
      [x - 32, y + 11],
      [x + 65, y + 22],
      [x + 25, y - 78],
    ],
    "rgba(219,178,108,.025)",
  );
}
function base(c: CanvasRenderingContext2D, loc: LocationId, dawn: boolean) {
  const bg = c.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, dawn ? "#7d9390" : "#122b31");
  bg.addColorStop(0.55, dawn ? "#506864" : "#1c393b");
  bg.addColorStop(1, dawn ? "#354c49" : "#102829");
  c.fillStyle = bg;
  c.fillRect(0, 0, W, H);
  let seed = 87;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  if (loc === "street" || loc === "power") {
    polygon(
      c,
      [
        [0, 345],
        [150, 252],
        [350, 287],
        [522, 163],
        [743, 234],
        [922, 163],
        [1200, 279],
        [1200, 0],
        [0, 0],
      ],
      dawn ? "#586e6b" : "#173036",
    );
    for (let i = 0; i < 34; i++)
      tree(c, i * 43 - 50, 220 + rand() * 105, 0.7 + rand() * 0.7);
    polygon(
      c,
      [
        [250, 800],
        [572, 383],
        [674, 388],
        [982, 800],
      ],
      dawn ? "#63736c" : "#344747",
    );
    polygon(
      c,
      [
        [0, 488],
        [453, 422],
        [731, 465],
        [1200, 354],
        [1200, 419],
        [742, 525],
        [428, 489],
        [0, 566],
      ],
      dawn ? "#63736c" : "#344747",
    );
    line(
      c,
      [
        [255, 800],
        [577, 395],
      ],
      "#5a6660",
      3,
    );
    line(
      c,
      [
        [970, 800],
        [663, 397],
      ],
      "#53635e",
      3,
    );
    for (let i = 0; i < 90; i++) {
      const x = rand() * 1200,
        y = 350 + rand() * 450;
      c.fillStyle = "rgba(143,160,142,.07)";
      c.fillRect(x, y, 2 + rand() * 12, 1);
    }
    if (loc === "street") {
      house(c, 515, 334, 128, 130, "Bellwether", true, dawn);
      house(c, 244, 438, 161, 112, "County archive", false, dawn);
      house(c, 120, 548, 170, 110, "Police", false, dawn);
      house(c, 767, 449, 160, 117, "Radio 88.4", false, dawn);
      house(c, 911, 566, 170, 119, "St. Agnes", false, dawn);
      house(c, 342, 268, 82, 69, "", false, dawn);
      house(c, 835, 279, 82, 73, "", false, dawn);
      for (let i = 0; i < 9; i++)
        tree(c, 40 + i * 25, 660 + i * 9, 1.1 + i * 0.05);
      for (let i = 0; i < 7; i++) tree(c, 1030 + i * 32, 693 - i * 24, 1.2);
      lamp(c, 460, 580);
      lamp(c, 799, 664);
      lamp(c, 655, 366);
      c.save();
      c.translate(553, 590);
      c.rotate(0.12);
      c.fillStyle = "#526360";
      c.fillRect(-78, -14, 156, 36);
      c.strokeStyle = "#b3b59b";
      c.strokeRect(-74, -10, 148, 28);
      c.fillStyle = "#d2c5a5";
      c.font = "11px monospace";
      c.textAlign = "center";
      c.fillText("B E L L W E T H E R", 0, 8);
      c.restore();
    } else {
      for (let i = 0; i < 5; i++) {
        const x = 220 + i * 151;
        polygon(
          c,
          [
            [x, 440],
            [x + 65, 452],
            [x + 95, 421],
            [x + 32, 410],
          ],
          "#536664",
        );
        c.fillStyle = "#233e40";
        c.fillRect(x + 11, 337, 43, 104);
        for (let n = 0; n < 5; n++) {
          c.fillStyle = "#738580";
          c.fillRect(x + 6, 350 + n * 15, 53, 6);
        }
        line(
          c,
          [
            [x + 32, 337],
            [x + 32, 300],
            [x + 170, 300],
          ],
          "#152a2e",
          4,
        );
      }
      lamp(c, 724, 598);
      house(c, 110, 378, 135, 93, "High voltage", false, dawn);
    }
  } else {
    polygon(
      c,
      [
        [100, 382],
        [640, 188],
        [1120, 360],
        [579, 618],
      ],
      "#4d5b54",
      "#758078",
    );
    polygon(
      c,
      [
        [100, 382],
        [100, 222],
        [640, 30],
        [640, 188],
      ],
      "#20383a",
      "#4b5c57",
    );
    polygon(
      c,
      [
        [640, 30],
        [1120, 204],
        [1120, 360],
        [640, 188],
      ],
      "#182f33",
      "#4b5c57",
    );
    polygon(
      c,
      [
        [100, 382],
        [579, 618],
        [579, 671],
        [100, 432],
      ],
      "#162d30",
    );
    polygon(
      c,
      [
        [579, 618],
        [1120, 360],
        [1120, 408],
        [579, 671],
      ],
      "#203638",
    );
    for (let i = 0; i < 13; i++) {
      const x = 135 + i * 70;
      line(
        c,
        [
          [x, 393 + (x - 135) * 0.44],
          [x + 460, 227 + (x - 135) * 0.37],
        ],
        "rgba(177,177,146,.13)",
      );
    }
    for (let i = 0; i < 9; i++)
      line(
        c,
        [
          [115 + i * 55, 377 - i * 19],
          [593 + i * 54, 607 - i * 25],
        ],
        "rgba(19,37,37,.2)",
      );
    for (let i = 0; i < 3; i++) {
      const x = 240 + i * 145,
        y = 175 - i * 51;
      polygon(
        c,
        [
          [x, y],
          [x + 70, y - 25],
          [x + 70, y + 55],
          [x, y + 80],
        ],
        "#0d2228",
        "#607572",
      );
      polygon(
        c,
        [
          [x + 6, y + 4],
          [x + 64, y - 17],
          [x + 64, y + 47],
          [x + 6, y + 68],
        ],
        dawn ? "#bbccb4" : "#537573",
      );
      line(
        c,
        [
          [x + 35, y - 9],
          [x + 35, y + 62],
        ],
        "#293e3b",
        4,
      );
      light(c, x + 30, y + 75, 130, dawn ? "232,204,150" : "119,157,141", 0.14);
    }
    const desk = (x: number, y: number, w = 145) => {
      polygon(
        c,
        [
          [x, y],
          [x + w, y + 43],
          [x + w + 58, y + 10],
          [x + 58, y - 32],
        ],
        "#827456",
        "#baaa80",
      );
      polygon(
        c,
        [
          [x, y],
          [x + w, y + 43],
          [x + w, y + 67],
          [x, y + 24],
        ],
        "#4b5144",
      );
      line(
        c,
        [
          [x + 10, y + 24],
          [x + 10, y + 61],
        ],
        "#182c2a",
        8,
      );
      line(
        c,
        [
          [x + w, y + 60],
          [x + w, y + 91],
        ],
        "#182c2a",
        8,
      );
    };
    if (loc === "archive") {
      for (let j = 0; j < 3; j++) {
        let x = 732 + j * 94,
          y = 138 + j * 34;
        polygon(
          c,
          [
            [x, y],
            [x + 80, y + 29],
            [x + 80, y + 156],
            [x, y + 127],
          ],
          "#3e4840",
        );
        for (let k = 0; k < 3; k++) {
          line(
            c,
            [
              [x, y + 40 + k * 36],
              [x + 80, y + 69 + k * 36],
            ],
            "#998766",
            4,
          );
          for (let n = 0; n < 8; n++) {
            const xx = x + 6 + n * 9,
              yy = y + 8 + k * 36 + n * 3.4;
            line(
              c,
              [
                [xx, yy],
                [xx, yy + 25],
              ],
              ["#997c5f", "#6b8280", "#9a9d7e"][n % 3],
              6,
            );
          }
        }
      }
      desk(425, 418, 177);
      c.fillStyle = "#ded0a9";
      c.fillRect(472, 407, 54, 26);
    }
    if (loc === "police") {
      desk(392, 425);
      desk(740, 374, 105);
      c.fillStyle = "#382e27";
      c.fillRect(445, 401, 28, 20);
      c.fillStyle = "#acaa80";
      c.fillRect(529, 180, 125, 71);
      for (let i = 0; i < 7; i++) {
        c.fillStyle = "#d1c39b";
        c.fillRect(537 + i * 16, 192, 11, 34);
      }
      c.fillStyle = "#3c5150";
      c.fillRect(778, 260, 122, 49);
    }
    if (loc === "clinic") {
      desk(380, 420, 180);
      polygon(
        c,
        [
          [772, 343],
          [874, 377],
          [929, 343],
          [827, 308],
        ],
        "#c0bf9e",
      );
      polygon(
        c,
        [
          [772, 343],
          [874, 377],
          [874, 405],
          [772, 371],
        ],
        "#889787",
      );
      c.fillStyle = "#ded6b8";
      c.fillRect(790, 320, 41, 21);
      c.fillStyle = "#49695f";
      c.fillRect(704, 202, 76, 107);
      c.fillStyle = "#b1b394";
      c.fillRect(715, 215, 53, 63);
      c.fillStyle = "#826b5b";
      c.fillRect(734, 225, 12, 43);
      c.fillRect(719, 240, 42, 12);
    }
    if (loc === "radio") {
      desk(420, 424, 180);
      for (let i = 0; i < 4; i++) {
        c.fillStyle = "#283e3b";
        c.fillRect(731 + i * 53, 229 + i * 17, 45, 116);
        for (let k = 0; k < 4; k++) {
          c.fillStyle = "#bd9e62";
          c.fillRect(739 + i * 53, 240 + i * 17 + k * 20, 28, 9);
        }
      }
      for (let i = 0; i < 2; i++) {
        c.fillStyle = "#182e2d";
        c.beginPath();
        c.arc(485 + i * 46, 410 + i * 10, 20, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = "#a1a58c";
        c.stroke();
      }
      line(
        c,
        [
          [590, 427],
          [591, 365],
          [615, 350],
        ],
        "#20302b",
        5,
      );
    }
    if (loc === "clock") {
      for (let i = 0; i < 3; i++) {
        const x = 480 + i * 119,
          y = 302 + i * 42,
          rad = 70 - i * 13;
        c.strokeStyle = "#93805b";
        c.lineWidth = 12;
        c.beginPath();
        c.arc(x, y, rad, 0, Math.PI * 2);
        c.stroke();
        for (let n = 0; n < 12; n++) {
          const a = (n * Math.PI) / 6;
          line(
            c,
            [
              [x + Math.cos(a) * 15, y + Math.sin(a) * 15],
              [x + Math.cos(a) * rad, y + Math.sin(a) * rad],
            ],
            "#8b7d5b",
            7,
          );
        }
        c.fillStyle = "#ceb786";
        c.beginPath();
        c.arc(x, y, 9, 0, Math.PI * 2);
        c.fill();
      }
      line(
        c,
        [
          [744, 210],
          [744, 440],
        ],
        "#9c916c",
        3,
      );
      c.fillStyle = "#ab9667";
      c.beginPath();
      c.ellipse(744, 443, 18, 34, 0, 0, Math.PI * 2);
      c.fill();
      desk(777, 469, 95);
    }
    if (loc === "chamber") {
      c.strokeStyle = dawn ? "#d1be88" : "#75948b";
      c.lineWidth = 7;
      c.beginPath();
      c.ellipse(610, 399, 219, 103, 0, 0, Math.PI * 2);
      c.stroke();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3,
          x = 610 + Math.cos(a) * 220,
          y = 399 + Math.sin(a) * 103;
        line(
          c,
          [
            [x, y],
            [x, y - 91],
          ],
          "#597674",
          14,
        );
        light(c, x, y - 91, 37, "175,203,163", 0.18);
      }
      desk(476, 436, 131);
      c.fillStyle = "#162b2c";
      c.fillRect(573, 300, 47, 70);
      line(
        c,
        [
          [579, 373],
          [579, 415],
        ],
        "#8e937b",
        6,
      );
      line(
        c,
        [
          [614, 371],
          [614, 414],
        ],
        "#8e937b",
        6,
      );
    }

    // A lived-in room: storage, low furniture, a faded notice and a patterned runner.
    polygon(
      c,
      [
        [395, 509],
        [552, 585],
        [803, 463],
        [647, 401],
      ],
      "rgba(35,61,55,.25)",
      "#7a806141",
    );
    for (let i = 0; i < 5; i++)
      line(
        c,
        [
          [415 + i * 20, 521 + i * 10],
          [651 + i * 20, 413 + i * 10],
        ],
        "#83927216",
        2,
      );
    polygon(
      c,
      [
        [174, 364],
        [253, 391],
        [253, 295],
        [174, 268],
      ],
      "#324841",
      "#81907b",
    );
    polygon(
      c,
      [
        [253, 391],
        [282, 372],
        [282, 279],
        [253, 295],
      ],
      "#233d39",
    );
    for (let i = 0; i < 3; i++) {
      line(
        c,
        [
          [179, 293 + i * 27],
          [249, 316 + i * 27],
        ],
        "#6f7d61",
      );
      line(
        c,
        [
          [202, 308 + i * 26],
          [223, 315 + i * 26],
        ],
        "#c0af7b",
        3,
      );
    }
    polygon(
      c,
      [
        [907, 289],
        [977, 315],
        [977, 244],
        [907, 218],
      ],
      "#b1a581",
    );
    c.save();
    c.translate(918, 243);
    c.transform(1, 0.35, 0, 1, 0, 0);
    c.fillStyle = "#4b584a";
    c.font = "6px monospace";
    c.fillText(
      loc === "clinic"
        ? "NIGHT WARD"
        : loc === "radio"
          ? "ON THE AIR"
          : loc === "archive"
            ? "MNEMOSYNE"
            : "BELLWETHER",
      0,
      0,
    );
    for (let i = 0; i < 5; i++) {
      c.fillStyle = "#746f55";
      c.fillRect(0, 10 + i * 6, 42 - i * 3, 1);
    }
    c.restore();
    // Papers have ink rules rather than contemporary screens.
    for (let i = 0; i < 3; i++) {
      const x = 460 + i * 21,
        y = 418 + i * 7;
      polygon(
        c,
        [
          [x, y],
          [x + 26, y + 8],
          [x + 38, y + 1],
          [x + 12, y - 7],
        ],
        "#c0b18b",
      );
      line(
        c,
        [
          [x + 7, y],
          [x + 22, y + 5],
        ],
        "#7b7b5b",
        1,
      );
    }
    const chair = (x: number, y: number) => {
      polygon(
        c,
        [
          [x, y],
          [x + 32, y + 11],
          [x + 49, y + 1],
          [x + 17, y - 10],
        ],
        "#596b54",
      );
      line(
        c,
        [
          [x + 3, y],
          [x + 3, y - 32],
          [x + 30, y - 23],
          [x + 30, y + 9],
        ],
        "#3a5146",
        5,
      );
      line(
        c,
        [
          [x + 4, y + 2],
          [x + 4, y + 25],
        ],
        "#233e35",
        4,
      );
      line(
        c,
        [
          [x + 39, y + 7],
          [x + 39, y + 29],
        ],
        "#233e35",
        4,
      );
    };
    if (loc === "police") {
      chair(350, 455);
      chair(798, 423);
      c.fillStyle = "#a69574";
      c.fillRect(463, 396, 24, 7);
      line(
        c,
        [
          [459, 405],
          [456, 393],
          [461, 387],
          [475, 390],
          [481, 397],
          [481, 410],
        ],
        "#663e34",
        5,
      );
      c.strokeStyle = "#bcb386";
      c.lineWidth = 2;
      c.beginPath();
      c.arc(485, 371, 12, 0, Math.PI * 2);
      c.stroke();
      line(
        c,
        [
          [485, 360],
          [485, 371],
          [492, 378],
        ],
        "#bcb386",
        1,
      );
      c.fillStyle = "#cebd93";
      c.font = "8px monospace";
      c.fillText("DISPATCH / 23:56", 417, 491);
    }
    if (loc === "archive") {
      chair(540, 487);
      polygon(
        c,
        [
          [832, 482],
          [856, 458],
          [881, 493],
          [856, 512],
        ],
        "#81584a",
        "#b68368",
      );
      line(
        c,
        [
          [856, 458],
          [856, 512],
          [844, 539],
          [853, 556],
        ],
        "#b39465",
      );
      line(
        c,
        [
          [832, 482],
          [881, 493],
        ],
        "#c5b894",
      );
    }
    if (loc === "clinic") {
      chair(701, 405);
      c.fillStyle = "#aaa983";
      c.fillRect(699, 400, 20, 8);
      polygon(
        c,
        [
          [809, 532],
          [851, 531],
          [836, 545],
        ],
        "#d1c5a0",
      );
      polygon(
        c,
        [
          [816, 531],
          [829, 518],
          [841, 531],
        ],
        "#a9ae8b",
      );
      c.fillStyle = "#bbad82";
      c.beginPath();
      c.ellipse(568, 407, 9, 5, 0, 0, Math.PI * 2);
      c.fill();
      line(
        c,
        [
          [568, 407],
          [568, 394],
        ],
        "#cfbf98",
        10,
      );
    }
    if (loc === "clock") {
      c.fillStyle = "#d8c595";
      c.beginPath();
      c.ellipse(839, 520, 13, 5, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#aab391";
      c.fillRect(831, 505, 14, 13);
      c.strokeStyle = "#aab391";
      c.beginPath();
      c.arc(848, 511, 5, 0, Math.PI * 2);
      c.stroke();
      c.fillStyle = "#223d38";
      c.fillRect(833, 505, 10, 3);
    }
    if (loc === "radio") {
      chair(611, 484);
      c.fillStyle = "#b98962";
      c.fillRect(608, 401, 12, 5);
      line(
        c,
        [
          [608, 408],
          [631, 419],
          [621, 437],
          [644, 448],
        ],
        "#152e2a",
        2,
      );
      c.fillStyle = "#d2bc8b";
      c.font = "8px monospace";
      c.fillText("88.4 / CARRIER ACTIVE", 734, 369);
    }
    if (loc === "chamber") {
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3,
          x = 610 + Math.cos(a) * 220,
          y = 399 + Math.sin(a) * 103;
        line(
          c,
          [
            [x, y],
            [599, 445],
          ],
          dawn ? "#c7b47c" : "#688675",
          1,
        );
        c.fillStyle = "#b7b58d";
        c.font = "9px monospace";
        c.fillText(String(i + 1).padStart(2, "0"), x - 7, y - 104);
      }
      c.fillStyle = "#aa9968";
      c.font = "8px monospace";
      c.fillText("RETURN / FORWARD", 520, 477);
    }
    lamp(c, 978, 523);
  }
  // Rain streaks and a hand-printed grain are fixed to avoid noisy animation.
  for (let i = 0; i < 1800; i++) {
    c.fillStyle = rand() > 0.5 ? "rgba(218,213,174,.022)" : "rgba(0,0,0,.04)";
    c.fillRect(rand() * W, rand() * H, 1 + rand() * 3, 1);
  }
  const vign = c.createRadialGradient(640, 410, 160, 640, 410, 770);
  vign.addColorStop(0, "transparent");
  vign.addColorStop(1, "rgba(3,16,21,.72)");
  c.fillStyle = vign;
  c.fillRect(0, 0, W, H);
}
function person(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  t: number,
  moving = false,
  ghost = false,
  specialism = "",
) {
  c.save();
  c.translate(x, y);
  c.globalAlpha = ghost ? 0.35 : 1;
  const sway = moving ? Math.sin(t * 13) * 2 : Math.sin(t * 2) * 0.5;
  c.fillStyle = "rgba(0,0,0,.3)";
  c.beginPath();
  c.ellipse(0, 4, 13, 5, 0, 0, Math.PI * 2);
  c.fill();
  line(
    c,
    [
      [-4, -2],
      [-5 + (moving ? Math.sin(t * 13) * 4 : 0), 5],
    ],
    "#101e23",
    4,
  );
  line(
    c,
    [
      [4, -2],
      [5 - (moving ? Math.sin(t * 13) * 4 : 0), 5],
    ],
    "#101e23",
    4,
  );
  polygon(
    c,
    [
      [-7, -22 + sway],
      [5, -23 + sway],
      [10, -2],
      [-10, -2],
    ],
    color,
  );
  c.fillStyle = "#baa68b";
  c.beginPath();
  c.arc(0, -29 + sway, 6, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#233a3b";
  c.fillRect(-7, -35 + sway, 13, 6);
  line(
    c,
    [
      [7, -18 + sway],
      [12, -8 + sway],
    ],
    "#a4957c",
    3,
  );
  light(c, 13, -7, 23, "230,193,114", 0.1);
  if (specialism === "audio") {
    c.strokeStyle = "#b7c1ae";
    c.lineWidth = 2;
    c.beginPath();
    c.arc(0, -29 + sway, 8, Math.PI, 0);
    c.stroke();
    c.fillStyle = "#1d3230";
    c.fillRect(-9, -30 + sway, 4, 7);
  }
  if (specialism === "engineer") {
    c.fillStyle = "#645e45";
    c.fillRect(-11, -20 + sway, 7, 15);
    line(
      c,
      [
        [4, -17],
        [7, -8],
      ],
      "#d1bb7e",
      2,
    );
  }
  if (specialism === "cipher") {
    polygon(
      c,
      [
        [8, -14],
        [17, -12],
        [15, -4],
        [7, -6],
      ],
      "#d3ca9f",
    );
  }
  if (specialism === "forensic") {
    line(
      c,
      [
        [-7, -20],
        [8, -5],
      ],
      "#5c6150",
      2,
    );
    c.fillStyle = "#b6af7e";
    c.fillRect(4, -10, 9, 8);
  }
  if (specialism === "temporal") {
    c.strokeStyle = "#afc4b1";
    c.lineWidth = 1;
    c.beginPath();
    c.arc(12, -9, 3, 0, Math.PI * 2);
    c.stroke();
  }
  if (specialism === "trace") {
    c.fillStyle = "#e4c683";
    c.fillRect(11, -9, 4, 5);
  }
  c.restore();
}
export default function Scene({
  game,
  title = false,
  reduced = false,
  onObject,
}: {
  game?: GameView;
  title?: boolean;
  reduced?: boolean;
  onObject?: (id: string) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null),
    state = useRef(game);
  state.current = game;
  const you = game?.players.find((p) => p.id === game.you),
    loc = you?.location || "street",
    dawn = game?.status === "complete";
  useEffect(() => {
    const canvas = ref.current!,
      ctx = canvas.getContext("2d")!;
    const bg = document.createElement("canvas");
    bg.width = W;
    bg.height = H;
    base(bg.getContext("2d")!, loc, !!dawn);
    let raf = 0,
      previous = new Map<string, { x: number; y: number }>();
    let last = 0;
    const entered = performance.now();
    const durations: number[] = [];
    const render = (now: number) => {
      if (reduced && now - last < 100) {
        raf = requestAnimationFrame(render);
        return;
      }
      durations.push(now - last);
      if (durations.length > 180) durations.shift();
      last = now;
      (window as any).__scenePerformance = {
        sampleFrames: durations.length,
        meanFrameMs:
          durations.slice(1).reduce((a, b) => a + b, 0) /
          Math.max(1, durations.length - 1),
      };
      const bounds = canvas.getBoundingClientRect(),
        dpr = Math.min(window.devicePixelRatio || 1, 1.7),
        cw = Math.round(bounds.width * dpr),
        ch = Math.round(bounds.height * dpr);
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw;
        canvas.height = ch;
      }
      ctx.clearRect(0, 0, cw, ch);
      const scale = Math.max(cw / W, ch / H);
      ctx.setTransform(
        scale,
        0,
        0,
        scale,
        (cw - W * scale) / 2,
        (ch - H * scale) / 2,
      );
      ctx.drawImage(bg, 0, 0);
      const t = reduced ? 0 : now / 1000,
        g = state.current;
      if (!reduced) {
        for (let i = 0; i < 4; i++) {
          const x = ((t * (5 + i * 2) + i * 355) % 1700) - 240,
            y = 405 + i * 93;
          ctx.save();
          ctx.scale(1, 0.3);
          light(ctx, x, y / 0.3, 245, "168,188,178", 0.038);
          ctx.restore();
        }
      }
      if (g) {
        for (const door of entrances(loc)) {
          const open = LOCATIONS.find(l => l.id === door.id)!.requires.every(id => g.solved.includes(id));
          const x = door.x * 12, y = door.y * 8;
          ctx.fillStyle = open ? "#c5ead4" : "#b2baa9";
          ctx.textAlign = "center";
          ctx.font = "10px sans-serif";
          ctx.fillText(door.name, x, y + 8);

        }
        for (const h of HOTSPOTS.filter((h) => h.location === loc)) {
          const x = h.x * 12,
            y = h.y * 8;
          ctx.strokeStyle = "#d3b77e";
          ctx.lineWidth = 1.2;
          ctx.globalAlpha = 0.55 + Math.sin(t * 2) * 0.15;
          ctx.beginPath();
          ctx.ellipse(x, y, 19, 8, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
          ctx.fillStyle = "#d3b77e";
          polygon(
            ctx,
            [
              [x, y - 39],
              [x + 3, y - 35],
              [x, y - 31],
              [x - 3, y - 35],
            ],
            "#d3b77e",
          );
          ctx.font = "10px monospace";
          ctx.textAlign = "center";
          ctx.fillStyle = "#e0d5b9";
          ctx.fillText(h.name, x, y + 24);
        }
        for (const p of g.players
          .filter((p) => p.location === loc)
          .sort((a, b) => a.y - b.y)) {
          const prev = previous.get(p.id) || p;
          const moving = Math.hypot(prev.x - p.x, prev.y - p.y) > 0.015;
          const x = prev.x + (p.x - prev.x) * 0.3,
            y = prev.y + (p.y - prev.y) * 0.3;
          previous.set(p.id, { x, y });
          const role = ROLES.find((r) => r.id === p.role);
          person(
            ctx,
            x * 12,
            y * 8,
            role?.color || "#b5aa86",
            t,
            moving,
            false,
            p.role,
          );
          if (p.id === g.you) {
            ctx.strokeStyle = "#d8cda9";
            ctx.beginPath();
            ctx.ellipse(x * 12, y * 8 + 6, 16, 7, 0, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.fillStyle = "#e4ddc9";
          ctx.textAlign = "center";
          ctx.font = "10px sans-serif";
          ctx.fillText(p.name, x * 12, y * 8 - 47);
        }
        if (dawn) {
          for (let i = 0; i < (loc === "street" ? 7 : 3); i++) {
            const x = 325 + i * 83,
              y = 550 + Math.sin(i) * 35;
            person(
              ctx,
              x,
              y,
              ["#9d9e81", "#a79579", "#889d90"][i % 3],
              t + i,
              true,
            );
            if (i < 3) {
              ctx.fillStyle = "#d8dbb7";
              ctx.font = "10px Georgia";
              ctx.textAlign = "center";
              ctx.fillText(["Mara", "Kit", "Inez"][i], x, y - 45);
            }
          }
          if (loc === "street" || loc === "clinic") {
            const bx = 760 + (reduced ? 0 : (t * 5) % 120),
              by = 620;
            polygon(
              ctx,
              [
                [bx, by],
                [bx + 23, by],
                [bx + 14, by + 9],
              ],
              "#d4c89e",
            );
            polygon(
              ctx,
              [
                [bx + 4, by],
                [bx + 11, by - 9],
                [bx + 18, by],
              ],
              "#b4b990",
            );
          }
          light(ctx, 900, 50, 850, "248,212,142", 0.18);
        } else if (g.solved.length > 3) {
          person(ctx, 805, 454, "#a9c2b9", t, false, true);
        }
      } else {
        for (let i = 0; i < 6; i++)
          person(
            ctx,
            515 + i * 24,
            674 + Math.abs(i - 2) * 10,
            ROLES[i].color,
            t + i,
            false,
            false,
            ROLES[i].id,
          );
      }
      if (!reduced && now - entered < 900) {
        ctx.fillStyle = `rgba(10,28,30,${0.65 * (1 - (now - entered) / 900)})`;
        ctx.fillRect(0, 0, W, H);
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [loc, dawn, reduced]);
  return (
    <canvas
      ref={ref}
      className={"town-canvas " + (title ? "title-scene" : "")}
      aria-label={
        title
          ? "Illustrated Bellwether at night, with warm windows, fog and six investigators"
          : `Exploring ${loc}. Use the marked objects or the accessible nearby objects list.`
      }
      onClick={(e) => {
        if (!onObject) return;
        const b = e.currentTarget.getBoundingClientRect(),
          s = Math.max(b.width / W, b.height / H),
          x = (e.clientX - b.left - (b.width - W * s) / 2) / s,
          y = (e.clientY - b.top - (b.height - H * s) / 2) / s;
        const h = HOTSPOTS.find(
          (h) =>
            h.location === loc && Math.hypot(h.x * 12 - x, h.y * 8 - y) < 43,
        );
        if (h) onObject(h.id);
      }}
    />
  );
}
