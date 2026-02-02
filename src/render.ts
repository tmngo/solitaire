import { Vec2 } from "./math/vec2";

const loadImageBitMap = async (url: string) => {
  const res = await fetch(url);
  const blob = await res.blob();
  return await createImageBitmap(blob, { colorSpaceConversion: "none" });
};

export const createTextureFromUrl = async (
  device: GPUDevice,
  url: string,
  filter: GPUFilterMode
) => {
  const source = await loadImageBitMap(url);
  const texture = device.createTexture({
    label: url,
    format: "rgba8unorm",
    size: [source.width, source.height],
    usage:
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.RENDER_ATTACHMENT,
  });
  device.queue.copyExternalImageToTexture(
    { source, flipY: true },
    { texture },
    { width: source.width, height: source.height }
  );
  const sampler = device.createSampler({
    label: "Sampler",
    magFilter: filter,
    minFilter: filter,
  });
  return [texture, sampler] as const;
};

/*
    1-------2
    |     / |
    |   /   |
    | /     |
    3-------4
  */
export const getSpritesheetUVs = (input: {
  texture: GPUTexture;
  col: number;
  row: number;
  w: number;
  h: number;
  p: number;
}): Vec2[] => {
  const { col, row, texture, w, h, p } = input;
  return [
    [
      ((col + 1) * (p + w) - w) / texture.width,
      1 - ((row + 1) * (p + h) - h) / texture.height,
    ],
    [
      ((col + 1) * (p + w)) / texture.width,
      1 - ((row + 1) * (p + h) - h) / texture.height,
    ],
    [
      ((col + 1) * (p + w) - w) / texture.width,
      1 - ((row + 1) * (p + h)) / texture.height,
    ],
    [
      ((col + 1) * (p + w)) / texture.width,
      1 - ((row + 1) * (p + h)) / texture.height,
    ],
  ];
};
