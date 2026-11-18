import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import test from 'node:test';
import { anchorAt, assemblyMode, frameAssembly, interpolatedProgress } from '../src/explosion.mjs';
import { model, parts } from '../src/product.mjs';

test('state, easing and reversal retain their endpoints', () => {
  assert.equal(assemblyMode(0, null, null), 'assembled');
  assert.equal(assemblyMode(.4, null, 1), 'exploding');
  assert.equal(assemblyMode(1, null, null), 'exploded');
  assert.equal(assemblyMode(1, 'mos_sensor', null), 'focusing');
  assert.equal(assemblyMode(.9, null, 0), 'reassembling');
  assert.equal(interpolatedProgress(.38, 0, 0), .38);
  assert.equal(interpolatedProgress(.38, 0, 1), 0);
  assert.equal(interpolatedProgress(.38, 1, 1), 1);
  assert.equal(interpolatedProgress(0, 1, .5), .5);
});

test('portrait framing leaves enough room for the exploded extent', () => {
  const { center, size } = model.bounds.exploded;
  assert(frameAssembly(center, size, .86).radius > frameAssembly(center, size, 1.5).radius);
});

test('GLB matches the registry and all hotspot tracks at start, middle and end', async () => {
  const binary = await readFile(new URL(`../public/${model.path.replace('./', '')}`, import.meta.url));
  assert.equal(binary.toString('utf8', 0, 4), 'glTF');
  assert.equal(binary.readUInt32LE(4), 2);
  assert.equal(binary.readUInt32LE(8), binary.length);
  assert(binary.length < 2_000_000);
  const length = binary.readUInt32LE(12);
  const glb = JSON.parse(binary.subarray(20, 20 + length));
  const binStart = 20 + length + 8;
  const [clip] = glb.animations;
  assert.equal(glb.animations.length, 1);
  assert.equal(clip.name, model.animation);
  const root = glb.nodes.find((node) => node.name === 'THERMOBREATH_ROOT');
  assert.equal(root.children.length, 11);
  assert(glb.images.length > 0);
  assert(glb.meshes.every(({primitives}) => primitives.every((item) => item.attributes.NORMAL !== undefined)));
  function sample(accessor, index) {
    const info = glb.accessors[accessor];
    const view = glb.bufferViews[info.bufferView];
    const count = info.type === 'VEC3' ? 3 : 1;
    const start = binStart + (view.byteOffset ?? 0) + (info.byteOffset ?? 0) + index * (view.byteStride ?? count * 4);
    return Array.from({ length: count }, (_, axis) => binary.readFloatLE(start + 4 * axis));
  }

  for (const part of parts) {
    const node = glb.nodes.findIndex((item) => item.name === part.id);
    assert(root.children.includes(node));
    assert(glb.materials.some(({name}) => name.startsWith(`${part.id}__`)));
    const track = clip.channels.find(({target}) => target.node === node && target.path === 'translation');
    const sampler = clip.samplers[track.sampler];
    const baseline = sample(sampler.output, 0);
    assert.deepEqual(glb.accessors[sampler.input].min, [0]);
    assert.deepEqual(glb.accessors[sampler.input].max, [1]);
    for (const time of [0, .25, .5, .75, 1]) {
      const frame = Math.round(time * 100);
      assert(Math.abs(sample(sampler.input, frame)[0] - time) < .0001);
      const position = sample(sampler.output, frame);
      const anchor = anchorAt(time, part);
      anchor.forEach((value, axis) => {
        assert(Math.abs((value - part.anchor[axis]) - (position[axis] - baseline[axis])) < .0001,
          `${part.id} differs from GLB at ${time}`);
      });
    }
  }
});
