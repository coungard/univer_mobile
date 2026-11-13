import React from 'react';
import { Image, Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { Avatar } from '../src/components/Avatar';

async function render(url: string | null | undefined) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <Avatar url={url} initials="ИП" size={44} backgroundColor="#742F25" textColor="#FAF4EE" />,
    );
  });
  return renderer.root;
}

test('draws the initials without a photo', async () => {
  const root = await render(null);
  expect(root.findByType(Text).props.children).toBe('ИП');
  expect(root.findAllByType(Image)).toHaveLength(0);
});

test('draws the photo over the initials', async () => {
  const root = await render('https://api.univerapp.ru/media/avatars/1/128.jpg');
  expect(root.findByType(Text).props.children).toBe('ИП');
  expect(root.findByType(Image).props.source).toEqual({ uri: 'https://api.univerapp.ru/media/avatars/1/128.jpg' });
});

test('falls back to the initials when the photo fails to load', async () => {
  const root = await render('https://api.univerapp.ru/media/avatars/1/128.jpg');
  await ReactTestRenderer.act(() => {
    root.findByType(Image).props.onError();
  });
  expect(root.findAllByType(Image)).toHaveLength(0);
});
