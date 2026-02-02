import { Card } from "./cards";

import * as Mat3 from "./math/mat3";
import { Vec2 } from "./math/vec2";
import shaderSource from "./shaders/shader.wgsl?raw";
import { Vec3 } from "./math/vec3";
import { CardSprite, Depot, Point2D, Rect } from "./layout";
import { Klondike, KlondikeDepot } from "./games/klondike";
import { Sawayama } from "./games/sawayama";
import { createTextureFromUrl, getSpritesheetUVs } from "./render";
import { uuidv7obj } from "uuidv7";
import spritesheetUrl from "./assets/card-spritesheet.png";

type State = {
  // Tracks absolute order of cards for rendering
  cards: CardSprite[];
  // Tracks card locations for game rules
  depots: Depot[];
  hand: CardSprite[];
  selection: {
    a?: number;
    n?: number;
    aTop: number;
    card?: Card;
    offset: Point2D;
    position?: Point2D;
  };
  hovered: number;
  lastMove?: {
    a: number;
    b: number;
    n: number;
  };
  hoveredCard: number;
  rank: string;
  moves: { a: number; b: number; n: number }[];
};

const state: State = {
  cards: [],
  depots: [],
  hand: [],
  selection: { offset: { x: 0, y: 0 }, aTop: 1 },
  hovered: -1,
  hoveredCard: -1,
  rank: "",
  moves: [],
};
const game: Game = Sawayama;

// Move to top of sort order.
const moveToTop = (
  state: { depots: Depot[]; hand: CardSprite[] },
  a: number,
  n: number,
  lifo = false,
) => {
  const deleted = state.depots[a].cards.splice(
    state.depots[a].cards.length - n,
  );

  // Move any cards on top of this card too
  // const spliceIndex = findCardIndex(card.location.cards, card);
  // for (let j = spliceIndex + 1; j < card.location.cards.length; j++) {
  //   const cardIndex = findCardIndex(state.cards, card.location.cards[j]);
  //   deleted.push(...state.cards.splice(cardIndex, 1));
  // }

  if (lifo) {
    state.hand.push(...deleted.reverse());
  } else {
    state.hand.push(...deleted);
  }
  return deleted.length;
};

const moveCardsToDepot = (
  state: { depots: Depot[]; hand: CardSprite[] },
  b: number,
  lifo = false,
) => {
  // remove cards from depot
  // const removed = state.depots[a].cards.splice(
  //   state.depots[a].cards.length - n
  // );
  // modify new depot
  if (lifo) {
    state.depots[b].cards.push(...state.hand.reverse());
  } else {
    state.depots[b].cards.push(...state.hand);
  }

  state.hand = [];

  return state.hand.length;
};

interface Game {
  initDepots: (
    state: State,
    left: number,
    top: number,
    cardWidth: number,
    cardHeight: number,
  ) => void;
  isRestockValid: () => boolean;
  isStockEmpty: (state: State) => boolean;
  isValidMove: (state: State, a: number, b: number, n: number) => boolean;
  isValidStart: (state: State, a: number, n: number) => boolean;
  score: (state: State) => number;
  parseMove: (
    state: State,
    a: number,
    b: number,
    n: number,
  ) => readonly [boolean, number, number, number];
}

const getUserID = () => {
  const stored = window.localStorage.getItem("uid");
  if (stored) return stored;

  const uid = uuidv7obj().toHex();
  window.localStorage.setItem("uid", uid);
  return uid;
};

const make = async () => {
  const uid = getUserID();

  let isSidebarVisible = false;

  const sidebarEl = document.querySelector<HTMLDivElement>("#sidebar");
  if (sidebarEl) {
    sidebarEl.innerHTML = `
    <button id="toggle-sidebar">⛭</button>
    <select id="select"></select>
    <button id="new-game">New</button>
    <button id="reset-game">Reset</button>
    `;
  }

  const closeSidebar = () => {
    canvas.style.transform = "translateX(0px)";
    if (sidebarEl) {
      sidebarEl.style.transform = "translateX(0px)";
    }
    isSidebarVisible = false;
  };

  const openSidebar = () => {
    canvas.style.transform = "translateX(-144px)";
    if (sidebarEl) {
      sidebarEl.style.transform = "translateX(-144px)";
    }
    isSidebarVisible = true;
  };

  document
    .querySelector<HTMLButtonElement>("#toggle-sidebar")
    ?.addEventListener("pointerup", async () => {
      if (isSidebarVisible) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });

  const selectEl = document.querySelector<HTMLSelectElement>("#select");
  if (selectEl) {
    selectEl.innerHTML = `
        <option value="klondike">Klondike</option>
        <option value="sawayama">Sawayama</option>
        <option value="freecell">FreeCell</option>
      `;
    selectEl.onchange = () => {
      console.log("selectEl", selectEl.value);
    };
  }

  document
    .querySelector<HTMLButtonElement>("#new-game")
    ?.addEventListener("pointerup", async () => {
      if (state.moves.length > 8) {
        invokeCheckGame(uid, state.rank, state.moves);
      }
      invokeNewGame();
    });

  document
    .querySelector<HTMLButtonElement>("#reset-game")
    ?.addEventListener("pointerup", async () => {
      if (state.moves.length > 8) {
        invokeCheckGame(uid, state.rank, state.moves);
      }
      invokeNewGame(state.rank);
    });

  // Connect to server

  // const dial = () => {
  //   const port = 3001;
  //   // try {
  //     conn = new WebSocket(`ws://${location.hostname}:${port}/subscribe`);
  //     console.log(conn);
  //     conn.addEventListener("close", (ev) => {
  //       console.log("close", ev);
  //       if (ev.code !== 1001) {
  //         console.log("close", "Reconnecting in 1s", ev);
  //         setTimeout(dial, 1000);
  //       }
  //     });
  //     conn.addEventListener("open", (ev) => {
  //       console.info("open", ev);
  //     });
  //     conn.addEventListener("message", (ev) => {
  //       if (typeof ev.data !== "string") {
  //         console.error("unexpected message type", typeof ev.data);
  //         return;
  //       }
  //       // console.log("message", ev.data);
  //       if (ev.data.startsWith("init<")) {
  //         console.log(ev.data);
  //         state.selection.cardIndex = undefined;
  //         Klondike.setState(state, ev.data);
  //         // console.log(split);
  //         // console.log(state);
  //       }
  //     });
  //   // } catch (e) {
  //   //   console.error(e);
  //   // }
  // };
  // dial();

  if (!navigator.gpu) {
    throw new Error("WebGPU is not supported on this browser.");
  }
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw new Error("No appropriate GPUAdapter found.");
  }
  const device = await adapter.requestDevice();

  // Load assets
  const [spritesheet, sampler] = await createTextureFromUrl(
    device,
    spritesheetUrl,
    "nearest",
  );
  const canvas = document.createElement("canvas");
  canvas.style.height = "100%";
  canvas.style.width = "100%";
  const context = canvas.getContext("webgpu");
  if (!context) {
    throw new Error("Failed to get WebGPU context.");
  }
  const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device,
    format: canvasFormat,
  });
  // const debounce = (fn: (entries: any) => void, ms: number) => {
  //   let timeout: number;
  //   return function (this: typeof fn, ...args: Parameters<typeof fn>) {
  //     clearTimeout(timeout);
  //     timeout = setTimeout(() => fn.apply(this, args), ms);
  //   };
  // };

  const left = 15;
  const top = 35;
  const cardHeight = 78;
  const cardWidth = 59;
  const marginX = 11;
  const cardMargin = 2;
  const layoutWidth = (cardWidth + marginX) * 7 - marginX + 2 * left;
  const layoutHeight = 435 + 100; // 435

  const cardColumnOffset = () => {
    const widthFitScale = layoutWidth / canvas.width;
    const heightFitScale = layoutHeight / canvas.height;
    const ratio = widthFitScale / heightFitScale;

    const isWider = heightFitScale > widthFitScale;
    return Math.max(20, isWider ? 20 : Math.min(60 * (ratio - 1) + 20, 50));
  };

  /** Updates the location and position for `cardCount` cards from the top of the stack  */
  const updateCardLocations = (state: State, b: number, n: number) => {
    const [xScale, yScale] = Depot.getOffsetScale(state.depots[b]);
    const PER_CARD_OFFSET = xScale < yScale ? cardColumnOffset() : 20;
    const depot = state.depots[b];
    const cards = depot.cards;
    for (let i = cards.length - n; i < cards.length; i++) {
      const offset = i * PER_CARD_OFFSET;
      cards[i].location = depot;
      cards[i].x = depot.rect.x + offset * xScale;
      cards[i].y = depot.rect.y + offset * yScale;
    }
  };

  game.initDepots(state, left, top, cardWidth, cardHeight);

  const invokeNewGame = async (id?: string) => {
    const params = new URLSearchParams();
    if (id !== undefined) {
      params.append("id", id);
    }

    // const url = `https://bpt6k6puo6mrlt67zf2jce7ce40qqmgm.lambda-url.us-east-2.on.aws/`;
    // const url = `https://72cgjbyjm27zyb7c3luk2aue540fzyjl.lambda-url.us-east-2.on.aws/`;

    const url =
      import.meta.env.MODE === "development"
        ? "http://localhost:9000/lambda-url/new_game"
        : "https://72cgjbyjm27zyb7c3luk2aue540fzyjl.lambda-url.us-east-2.on.aws/";
    const res = await fetch(`${url}?${params}`);
    const encoded = await res.text();
    const [rank, ...data] = atob(encoded).split(" ");

    console.log("rank", rank);
    state.rank = rank;
    Klondike.setState2(state, data);
    for (let i = KlondikeDepot.Tableau1; i <= KlondikeDepot.Tableau7; i++) {
      updateCardLocations(state, i, state.depots[i].cards.length);
    }
  };

  const invokeCheckGame = async (
    uid: string,
    rank: string,
    moves: { a: number; b: number; n: number }[],
  ) => {
    const moveData = moves.reduce(
      (acc, { a, b, n }) =>
        acc +
        String.fromCharCode(a + 65) +
        String.fromCharCode(b + 65) +
        String.fromCharCode(n + 65),
      "",
    );
    try {
      // const url = `https://l43lgrwkv67ifusmm75o3ikgx40zwzdr.lambda-url.us-east-2.on.aws/`;

      const url =
        import.meta.env.MODE === "development"
          ? "http://localhost:9000/lambda-url/check_game"
          : `https://l43lgrwkv67ifusmm75o3ikgx40zwzdr.lambda-url.us-east-2.on.aws/`;

      const res = await fetch(url, {
        method: "POST",
        body: new Blob([btoa(`${uid} ${rank} ${moveData}`)], {
          type: "application/octet-stream",
        }),
      });
      if (res.status >= 400) {
        throw new Error(await res.text());
      }
      const encoded = await res.text();
      const decoded = atob(encoded);
      console.log(decoded);
      const [_, score, win] = decoded.split(" ");
      console.log("score", rank, moveData, score, win);
    } catch (err) {
      console.error(err);
    }
  };

  // "33586992525371681211664981504265948285683559947593459614443163538210720538133"
  // "35998086541118830848073395048747780627073073681721119125302724925251045398549"
  // "56552200524762784493099217782117928326209965438304936830629295931667953104608" // automove aces on deal/move
  // "55023973064490644078874601710662707669244973291442955263204826534069555882498" // automove initial ace
  // "36359609971579494075828714929049818041973629260136807041935467228254228542212" // difficult
  const initialID =
    "48104809227013641850957354651277120384703431324695249488991002367200845432480";
  invokeNewGame(initialID);
  // invokeNewGame();

  const computeSpriteVertices = (props: {
    cards: CardSprite[];
    depots: Depot[];
    hand: CardSprite[];
    w: number;
    h: number;
    dt: number;
    s?: number;
  }) => {
    const { s = 1 } = props;
    const w = s * props.w;
    const h = s * props.h;
    const vertices: number[] = [];
    const indices: number[] = [];
    // const rad = Math.PI / 6;
    const rad = 0;

    for (const depot of props.depots) {
      const { x: x0, y: y0 } = depot.rect;
      const positions: Vec2[] = [
        [x0, y0],
        [x0 + w, y0],
        [x0, y0 + h],
        [x0 + w, y0 + h],
      ];
      const uvs = getSpritesheetUVs({
        texture: spritesheet,
        col: depot.id === KlondikeDepot.Stock && depot.cards.length > 1 ? 1 : 0,
        row: 4,
        p: cardMargin,
        w: cardWidth,
        h: cardHeight,
      });

      const [topLeft, topRight, bottomLeft, bottomRight] = positions.map(
        (pos, i) => [pos[0], pos[1], uvs[i][0], uvs[i][1]],
      );

      const index = vertices.length / 4;
      vertices.push(...topLeft, ...topRight, ...bottomLeft, ...bottomRight);
      indices.push(index, index + 1, index + 3, index, index + 3, index + 2);
    }

    const getCardSpriteGeometry = (card: CardSprite) => {
      const naturalFrequency = 20.0;
      const dampingRatio = 0.7;

      const k = naturalFrequency * naturalFrequency; // stiffness
      const c = 2 * dampingRatio * naturalFrequency; // damping

      // spring force
      const fx = -k * (card.currentX - card.x);
      const fy = -k * (card.currentY - card.y);

      // damping force
      const dx = -c * card.vx;
      const dy = -c * card.vy;

      // acceleration = F / m
      const ax = fx + dx;
      const ay = fy + dy;

      // update velocity
      card.vx += ax * props.dt;
      card.vy += ay * props.dt;
      card.vx = Math.min(Math.max(-2500, card.vx), 2500);
      card.vy = Math.min(Math.max(-2500, card.vy), 2500);

      const x0 = card.currentX + card.vx * props.dt;
      const y0 = card.currentY + card.vy * props.dt;

      card.currentX = x0;
      card.currentY = y0;

      const pos = Vec2.from(x0, y0);
      const origin = Vec2.add(pos, [0.5 * w * s, 0.5 * h * s]);
      // const v1 = Vec2.rotate([x0, y0], origin, rad);

      let positions: Vec2[] = [
        [x0, y0],
        [x0 + w, y0],
        [x0, y0 + h],
        [x0 + w, y0 + h],
      ];
      for (let i = 0; i < positions.length; i++) {
        const pos3d = Vec3.rotateAxisAngle(
          [positions[i][0], positions[i][1], 0],
          Vec3.from(...origin, 0),
          Vec3.from(0, 1.0, 0),
          rad,
        );
        // const zPixel = pos3d[2];
        // const zClip = 1.0 + (1 * zPixel) / canvas.width;
        const zClip = 1.0;
        positions[i] = Vec2.from(pos3d[0] / zClip, pos3d[1] / zClip);
      }

      // const topLeft = [positions[0][0], positions[0][1], 0, 0];
      // const topRight = [...Vec2.rotate([x0 + w, y0], origin, rad), 1, 0];
      // const bottomLeft = [...Vec2.rotate([x0, y0 + h], origin, rad), 0, 1];
      // const bottomRight = [...Vec2.rotate([x0 + w, y0 + h], origin, rad), 1, 1];

      const { col, row } =
        card.location?.id === KlondikeDepot.Stock &&
        card.location?.cards.length > 1 &&
        card.x === card.location.rect.x
          ? { col: 1, row: 4 }
          : { col: card.card.rank, row: card.card.suit };

      const uvs = getSpritesheetUVs({
        texture: spritesheet,
        col,
        row,
        p: cardMargin,
        w: cardWidth,
        h: cardHeight,
      });

      const [topLeft, topRight, bottomLeft, bottomRight] = positions.map(
        (pos, i) => [pos[0], pos[1], uvs[i][0], uvs[i][1]],
      );

      const index = vertices.length / 4;
      vertices.push(...topLeft, ...topRight, ...bottomLeft, ...bottomRight);
      indices.push(index, index + 1, index + 3, index, index + 3, index + 2);
    };

    for (const depot of props.depots) {
      if (depot.id === state.selection.aTop) continue;
      const cards =
        depot.id === KlondikeDepot.Stock
          ? depot.cards.toReversed()
          : depot.cards;
      for (const card of cards) {
        getCardSpriteGeometry(card);
      }
    }

    const topCards =
      state.selection.aTop === KlondikeDepot.Stock
        ? state.depots[state.selection.aTop].cards.toReversed()
        : state.depots[state.selection.aTop].cards;
    for (const card of topCards) {
      getCardSpriteGeometry(card);
    }

    for (const card of props.hand) {
      getCardSpriteGeometry(card);
    }

    return [new Float32Array(vertices), new Uint16Array(indices)] as const;
  };
  const s = 1.0;

  // Define vertices
  const [vertices, indices] = computeSpriteVertices({
    cards: state.cards,
    depots: state.depots,
    hand: state.hand,
    w: cardWidth,
    h: cardHeight,
    dt: 0,
    s,
  });
  const vertexBuffer = device.createBuffer({
    label: "Cell vertices",
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  // console.log({ vertices, indices }, canvas.height, canvas.clientHeight);

  device.queue.writeBuffer(vertexBuffer, 0, vertices);
  const vertexBufferLayout: GPUVertexBufferLayout = {
    arrayStride: 16,
    attributes: [
      {
        format: "float32x2",
        offset: 0,
        shaderLocation: 0, // Position, see vertex shader
      },
      {
        format: "float32x2",
        offset: 8,
        shaderLocation: 1, // UV, see vertex shader
      },
    ],
  };
  // const indices = new Uint16Array([0, 1, 3, 0, 3, 2]);
  const indexBuffer = device.createBuffer({
    label: "Indices",
    size: indices.byteLength,
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(indexBuffer, 0, indices);

  const resolution = {
    x: canvas.width / window.devicePixelRatio,
    y: canvas.height / window.devicePixelRatio,
  };

  const translation = { x: 0, y: 0 };

  const projectionMatrix = Mat3.projection(canvas.width, canvas.height);

  // Define uniforms
  const uniformArray = new Float32Array([
    resolution.x,
    resolution.y,
    translation.x,
    translation.y,
    ...projectionMatrix.slice(0, 3),
    0,
    ...projectionMatrix.slice(3, 6),
    0,
    ...projectionMatrix.slice(6, 9),
    0,
  ]);
  const uniformBuffer = device.createBuffer({
    label: "Uniforms",
    size: uniformArray.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(uniformBuffer, 0, uniformArray);

  // Shader
  const cellShaderModule = device.createShaderModule({
    label: "Shader",
    code: shaderSource,
  });

  const bindGroupLayout = device.createBindGroupLayout({
    label: "bind group layout",
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        buffer: { type: "uniform" },
      },
      {
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        sampler: { type: "filtering" },
      },
      {
        binding: 2,
        visibility: GPUShaderStage.FRAGMENT,
        texture: {},
      },
    ],
  });
  const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [bindGroupLayout],
  });
  const cellPipeline = device.createRenderPipeline({
    label: "Cell pipeline",
    layout: pipelineLayout,
    vertex: {
      module: cellShaderModule,
      entryPoint: "vertex",
      buffers: [vertexBufferLayout],
    },
    fragment: {
      module: cellShaderModule,
      entryPoint: "fragment",
      targets: [
        {
          format: canvasFormat,
        },
      ],
    },
  });

  const bindGroup = device.createBindGroup({
    label: "Bind group",
    layout: cellPipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: { buffer: uniformBuffer },
      },
      {
        binding: 1,
        resource: sampler,
      },
      {
        binding: 2,
        resource: spritesheet.createView(),
      },
    ],
  });

  const infoElement = document.getElementById("info");
  let requestID: number | null = null;

  let prevTimeMS = 0;

  const renderFrame = (timeMS: DOMHighResTimeStamp) => {
    if (!context) return;

    const deltaTimeS = (timeMS - prevTimeMS) * 0.001;
    prevTimeMS = timeMS;

    const startTime = performance.now();

    const widthFitScale = layoutWidth / canvas.width;
    const heightFitScale = layoutHeight / canvas.height;

    const fitScale = Math.max(widthFitScale, heightFitScale);
    const isWider = heightFitScale > widthFitScale;

    const resolution = {
      x: fitScale * canvas.width,
      y: fitScale * canvas.height,
    };
    const translation = {
      x: isWider ? 0.5 * (canvas.width * fitScale - layoutWidth) : 0,
      y: 0,
    };

    // Update uniforms
    uniformArray.set(
      [resolution.x, resolution.y, translation.x, translation.y],
      0,
    );
    device.queue.writeBuffer(uniformBuffer, 0, uniformArray);

    // Update vertices
    const [vertices, indices] = computeSpriteVertices({
      cards: state.cards,
      depots: state.depots,
      hand: state.hand,
      w: cardWidth,
      h: cardHeight,
      dt: deltaTimeS,
      s,
    });
    const vertexBuffer = device.createBuffer({
      label: "vertexBuffer",
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(vertexBuffer, 0, vertices);
    const indexBuffer = device.createBuffer({
      label: "Indices",
      size: indices.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(indexBuffer, 0, indices);

    const encoder = device.createCommandEncoder();
    // Render pass
    // Clear the canvas
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: context.getCurrentTexture().createView(),
          loadOp: "clear",
          clearValue: { r: 0.12, g: 0.31, b: 0.21, a: 1 }, // New line
          storeOp: "store",
        },
      ],
    });
    pass.setPipeline(cellPipeline);
    pass.setVertexBuffer(0, vertexBuffer);
    pass.setIndexBuffer(indexBuffer, "uint16");
    pass.setBindGroup(0, bindGroup);
    // pass.draw(vertices.length / 4);
    pass.drawIndexed(indices.length);
    pass.end();
    device.queue.submit([encoder.finish()]);

    const jsTime = performance.now() - startTime;
    if (infoElement && timeMS % 100 < 20) {
      infoElement.textContent = `\
fps: ${(1 / deltaTimeS).toFixed(1)}
js: ${jsTime.toFixed(1)}ms
`;
    }

    requestID = window.requestAnimationFrame(renderFrame);
  };

  const observer = new ResizeObserver((entries) => {
    const devicePixelRatio = window.devicePixelRatio;
    for (const entry of entries) {
      const width =
        entry.devicePixelContentBoxSize?.[0].inlineSize ??
        entry.contentBoxSize[0].inlineSize * devicePixelRatio;
      const height =
        entry.devicePixelContentBoxSize?.[0].blockSize ??
        entry.contentBoxSize[0].blockSize * devicePixelRatio;
      const canvas = entry.target;
      if (canvas instanceof HTMLCanvasElement) {
        console.log({ width, height, devicePixelRatio, layoutWidth });
        const newWidth = Math.max(
          1,
          Math.min(width, device.limits.maxTextureDimension2D),
        );
        const newHeight = Math.max(
          1,
          Math.min(height, device.limits.maxTextureDimension2D),
        );

        canvas.width = newWidth;
        canvas.height = newHeight;
        console.log(canvas.width, canvas.height);
        for (let i = KlondikeDepot.Tableau1; i <= KlondikeDepot.Tableau7; i++) {
          updateCardLocations(state, i, state.depots[i].cards.length);
        }

        if (requestID) {
          window.cancelAnimationFrame(requestID);
          renderFrame(performance.now());
        }
      }
    }
  });

  try {
    observer.observe(canvas, { box: "device-pixel-content-box" });
  } catch {
    observer.observe(canvas, { box: "content-box" });
  }

  requestID = window.requestAnimationFrame(renderFrame);

  document.body.appendChild(canvas);

  const getMouseWorldPosition = (e: PointerEvent) => {
    const widthFitScale = layoutWidth / canvas.width;
    const heightFitScale = layoutHeight / canvas.height;
    const fitScale = Math.max(widthFitScale, heightFitScale); // multiply by fitScale to get from canvas coords to world coords
    const isWider = heightFitScale > widthFitScale;
    const translation = {
      x: isWider ? 0.5 * (canvas.width * fitScale - layoutWidth) : 0,
      y: 0,
    };

    return {
      x: e.offsetX * fitScale * window.devicePixelRatio - translation.x,
      y: e.offsetY * fitScale * window.devicePixelRatio - translation.y,
    };
  };

  canvas.addEventListener("pointerdown", (e: PointerEvent) => {
    if (isSidebarVisible) {
      closeSidebar();
      return;
    }
    if (state.selection.a !== undefined) return;
    // const posScreenSpace = {
    //   x: e.offsetX / canvas.width,
    //   y: e.offsetY / canvas.height,
    // };
    // Search from the top down.

    // const cardIndex = state.cards.findLastIndex((card) =>
    //   Rect.hasPoint(
    //     {
    //       x: e.offsetX,
    //       y: e.offsetY,
    //     },
    //     Rect.from(card.x, card.y, cardWidth * s, cardHeight * s)
    //   )
    // );

    const worldPos = getMouseWorldPosition(e);

    const result = getAtPointer(state, worldPos.x, worldPos.y);

    if (result !== undefined) {
      // const card = state.cards[cardIndex];
      // console.log("pointerdown", card);
      // if (result.a === KlondikeDepot.Stock) {
      //   const index = findCardIndex(
      //     state.cards,
      //     card.location.cards[Math.max(card.location.cards.length - 3, 0)]
      //   );
      //   const movedCount = moveToTop(state, index, false);

      //   state.selection.a = card.location.id;
      //   state.selection.n = Math.min(3, card.location.cards.length);
      //   state.selection.cardIndex = state.cards.length - movedCount;
      //   state.selection.offset = {
      //     x: e.offsetX - card.x,
      //     y: e.offsetY - card.y,
      //   };

      //   return;

      //   // if (
      //   //   Card.compareCards(
      //   //     card.card,
      //   //     card.location.cards[card.location.cards.length - 1].card
      //   //   ) === 0
      //   // ) {
      //   // }
      //   // break;
      // }

      if (game.isValidStart(state, result.a, result.n)) {
        console.log("pointerdown:isValidStart");
        // Track selection
        state.selection.a = result.a;
        state.selection.aTop = result.a;
        state.selection.n = result.n;
        // state.selection.cardIndex = state.cards.length - movedCount;
        state.selection.offset = {
          x: worldPos.x - state.depots[result.a].cards[result.ni].x,
          y: worldPos.y - state.depots[result.a].cards[result.ni].y,
        };
        document.body.style.cursor = "grabbing";

        moveToTop(state, result.a, result.n);
      }

      return;
    }

    const dstIndex = getDepotIndex(worldPos);
    if (
      dstIndex === KlondikeDepot.Stock &&
      state.depots[dstIndex].cards.length > 1
    ) {
      console.log("pointerdown stock");
      const stock = state.depots[dstIndex];
      // const index = findCardIndex(
      //   state.cards,
      //   stock.cards[Math.max(stock.cards.length - 3, 0)]
      // );
      // const movedCount = moveToTop(state, dstIndex, stock.cards.length, false);
      // state.selection.cardIndex = state.cards.length - movedCount;
      state.selection.a = dstIndex;
      state.selection.aTop = dstIndex;
      state.selection.n = Math.min(3, stock.cards.length);
      state.selection.offset = {
        x: worldPos.x - stock.rect.x,
        y: worldPos.y - stock.rect.y,
      };

      return;
    }

    // Handle restock
    // if (game.isRestockValid()) {
    //   for (let i = 0; i < state.depots.length; i++) {
    //     const depot = state.depots[i];
    //     if (
    //       Rect.hasPoint(
    //         {
    //           x: e.offsetX,
    //           y: e.offsetY,
    //         },
    //         depot.rect
    //       )
    //     ) {
    //       if (depot.id === KlondikeDepot.Stock && depot.cards.length === 0) {
    //         if (state.depots[KlondikeDepot.Waste].cards.length > 0) {
    //           const a = KlondikeDepot.Waste;
    //           const b = KlondikeDepot.Stock;
    //           const n = state.depots[a].cards.length;
    //           state.lastMove = { a, b, n };
    //           conn?.send(`move>${a} ${b} ${n}`);
    //         }
    //         return;
    //       }
    //     }
    //   }
    // }
  });

  const getAtPointer = (state: State, x: number, y: number) => {
    for (let a = 0; a < state.depots.length; a++) {
      const cards = state.depots[a].cards;
      for (let n = 1; n <= cards.length; n++) {
        const card = cards[cards.length - n];
        if (
          Rect.hasPoint(
            {
              x,
              y,
            },
            Rect.from(card.x, card.y, cardWidth * s, cardHeight * s),
          )
        ) {
          return { a, n, ni: cards.length - n };
        }
      }
    }

    return undefined;
  };

  canvas.addEventListener("pointerup", async (e: PointerEvent) => {
    if (state.selection.a === undefined || state.selection.n === undefined)
      return;

    const worldPos = getMouseWorldPosition(e);

    const result = getDestDepot(state.selection.a, state.selection.n, worldPos);
    if (!result) {
      // restored card locations
      moveCardsToDepot(state, state.selection.a);
      updateCardLocations(state, state.selection.a, state.selection.n);

      state.selection.a = undefined;
      state.selection.n = undefined;
      document.body.style.cursor = "auto";

      return;
    }

    if (state.hand.length === 0) {
      moveToTop(state, result.a, result.n, true);
    }

    moveCardsToDepot(state, result.b, false);
    updateCardLocations(state, result.b, result.n);

    const automoveCounts = Sawayama.getAutomaticMoves(
      state,
      (state, a, b, n) => {
        moveToTop(state, a, n, false);
        moveCardsToDepot(state, b, false);
      },
    );

    console.log("automoveCounts", automoveCounts);

    for (let i = 0; i < automoveCounts.length; i++) {
      if (automoveCounts[i] > 0) {
        // console.log("updateDepotCardLocations", KlondikeDepot.Foundation1 + i);
        updateCardLocations(
          state,
          KlondikeDepot.Foundation1 + i,
          automoveCounts[i],
        );
      }
    }

    state.selection.a = undefined;
    state.selection.n = undefined;
    document.body.style.cursor = "auto";
  });

  const getDestDepot = (
    a0: number,
    n0: number,
    worldPos: { x: number; y: number },
  ) => {
    // Assumes moved cards have been placed at top of stack
    const b0 = getDepotIndex({
      x: worldPos.x - state.selection.offset.x + cardWidth / 2,
      y: worldPos.y - state.selection.offset.y + cardHeight / 2,
    });
    console.log("getDestDepot:b0", b0);
    if (b0 === -1) {
      return undefined;
    }

    const [isParsed, a, b, n] = game.parseMove(state, a0, b0, n0);
    if (!isParsed) {
      return undefined;
    }

    const isValid = game.isValidMove(state, a, b, n);
    console.log("getDestDepot:isValid", isValid);
    if (!isValid) {
      return undefined;
    }

    state.lastMove = { a, b, n };
    state.moves.push({ a, b, n });

    console.log("state.moves", state.moves);

    if (game.score(state) === 52) {
      const stats = window.localStorage.getItem("stats");
      if (stats) {
        const parsed = JSON.parse(stats);
        window.localStorage.setItem(
          "stats",
          JSON.stringify({
            sawayama: {
              wins: (parsed.sawayama.wins ?? 0) + 1,
            },
          }),
        );
      } else {
        window.localStorage.setItem(
          "stats",
          JSON.stringify({
            sawayama: {
              wins: 1,
            },
          }),
        );
      }
    }

    if (state.moves.length > 52) {
      invokeCheckGame(uid, state.rank, state.moves);
    }

    return { a, b, n };
  };

  canvas.addEventListener("pointerleave", (_e: PointerEvent) => {
    // if (state.selection.cardIndex !== undefined) {
    // const index = state.selection.cardIndex;
    // const card = state.cards[index];
    // if (card.location) {
    //   const cardCount = state.cards.length - index;
    //   for (let j = 0; j < cardCount; j++) {
    //     state.cards[index + j] = {
    //       ...state.cards[index + j],
    //       x: card.location.rect.x,
    //       y:
    //         card.location.rect.y +
    //         (card.location.cards.length - cardCount + j) * 20,
    //     };
    //   }
    // }
    // }
    if (state.selection.a !== undefined && state.selection.n !== undefined) {
      moveCardsToDepot(state, state.selection.a);
      updateCardLocations(state, state.selection.a, state.selection.n);
    }
    state.selection.a = undefined;
    state.selection.n = undefined;
  });

  canvas.addEventListener("pointermove", (e: PointerEvent) => {
    const worldPos = getMouseWorldPosition(e);

    if (state.selection.a === undefined || state.selection.n === undefined) {
      const hovered = getDepotIndex({
        x: worldPos.x,
        y: worldPos.y,
      });

      const stock = state.depots[KlondikeDepot.Stock];

      if (stock.cards.length > 1) {
        if (state.hovered === 0 && hovered !== 0) {
          // const movedCount = moveToTop(
          //   state,
          //   KlondikeDepot.Stock,
          //   stock.cards.length,
          //   true
          // );
          updateCardLocations(state, KlondikeDepot.Stock, stock.cards.length);
        } else if (state.hovered !== 0 && hovered === 0) {
          if (stock.cards.length > 0) {
            // const movedCount = moveToTop(
            //   state,
            //   KlondikeDepot.Stock,
            //   stock.cards.length,
            //   true
            // );

            const waste = state.depots[KlondikeDepot.Waste];
            const [xScale, yScale] = Depot.getOffsetScale(waste);

            state.selection.aTop = KlondikeDepot.Stock;

            for (let i = stock.cards.length - 1; i >= 0; i--) {
              const offset =
                (waste.cards.length + stock.cards.length - i - 1) * 20;
              stock.cards[i] = {
                ...stock.cards[i],
                x: waste.rect.x + offset * xScale,
                y:
                  waste.rect.y +
                  offset * yScale -
                  (i >= stock.cards.length - 3 ? 10 : 20),
              };
            }
          }
        }
      }

      // const cardIndex = state.cards.findLastIndex((card) =>
      //   Rect.hasPoint(
      //     {
      //       x: e.offsetX,
      //       y: e.offsetY,
      //     },
      //     Rect.from(card.x, card.y, cardWidth * s, cardHeight * s)
      //   )
      // );

      // console.log("hovered", state.hoveredCard, cardIndex);
      // if (state.hoveredCard === -1 && cardIndex !== -1) {
      //   const card = state.cards[cardIndex];
      //   const n =
      //     card.location.cards.length - findCardIndex(card.location.cards, card);
      //   if (
      //     card.location.id !== KlondikeDepot.Stock &&
      //     game.isValidStart(state, card.location.id, n)
      //   ) {
      //     console.log("isValidStart");
      //     card.y += 5;
      //     state.hoveredCard = cardIndex;
      //   }
      //   state.hovered = hovered;
      //   return;
      // } else if (state.hoveredCard !== -1 && cardIndex !== state.hoveredCard) {
      //   // mouse leave
      //   state.cards[state.hoveredCard].y -= 5;
      //   state.hoveredCard = -1;
      // }
      state.hovered = hovered;

      return;
    }

    if (state.hand.length === 0) {
      return;
    }

    console.log("move", state.selection.a, state.selection.n);

    const target = {
      x: worldPos.x - state.selection.offset.x,
      y: worldPos.y - state.selection.offset.y,
    };

    if (
      state.selection.a === KlondikeDepot.Stock &&
      !game.isStockEmpty(state)
    ) {
      return;
    }

    // Move cards on top of selected card
    const [xScale, yScale] = Depot.getOffsetScale(
      state.depots[state.selection.a],
    );
    for (let i = 0; i < state.hand.length; i++) {
      const offset = i * 20;
      state.hand[i].x = target.x + xScale * offset;
      state.hand[i].y = target.y + yScale * offset;
    }
  });

  const getDepotIndex = (point: { x: number; y: number }) => {
    const PER_CARD_OFFSET = cardColumnOffset();
    return state.depots.findIndex((depot) => {
      const [xScale, yScale] = Depot.getOffsetScale(depot);

      const topOffset = depot.cards.length * PER_CARD_OFFSET;
      return Rect.hasPoint(point, {
        ...depot.rect,
        x: depot.rect.x + 20 * xScale,
        y: depot.rect.y + topOffset * yScale,
      });
    });
  };
};

document.fonts.ready.then(async () => {
  const myapp = await make();
  console.log({ myapp });
});
