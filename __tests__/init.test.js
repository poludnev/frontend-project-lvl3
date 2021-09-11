import '@testing-library/jest-dom';
import nock from 'nock';
import axios from 'axios';
import { expect, test } from '@jest/globals';
import { readFileSync } from 'fs';
import testingLibraryDom from '@testing-library/dom';
import defAdapter from 'axios/lib/adapters/http';
import testingLibraryUserEvent from '@testing-library/user-event';
// import rssParser from '../src/rssParser.js';
import app from '../src/init.js';

const getFixturePath = (filename) => `__fixtures__/${filename}`;
const userEvent = testingLibraryUserEvent.default;

axios.defaults.adapter = defAdapter;
const rssExamplePath1 = getFixturePath('rssExample1.txt');
const rssExamplePath2 = getFixturePath('rssExample2.txt');

// const parsedResultPath1 = getFixturePath('results/parsedRSSResult1.json');
// const parsedResultPath2 = getFixturePath('results/parsedRSSResult2.json');

// test.each`
//   sourcePath         | resultPath           | structureName
//   ${xmlExamplePath1} | ${parsedResultPath1} | ${'structure 1'}
//   ${xmlExamplePath2} | ${parsedResultPath2} | ${'structure 2'}
// `('When rss structure is the $structureName', ({ sourcePath, resultPath }) => {
//   const result = readFileSync(resultPath, 'utf-8');
//   const expected = JSON.parse(result);
//   const source = readFileSync(sourcePath, 'utf-8');
//   expect(rssParser(source)).toEqual(expected);
// });

/*
порядок тестов, при котором все работает:
1. network error
2. valid RSS1
3. valid RSS2
4. url exists

Если valid RSS оба теста объединить в один, то падает url exists - не срабатывает "RSS существует".Причем судя по логу, состояне приложения(watchedState) обнуляется.

Если тест network error сделать после valid RSS или urk exists - тест падпает.

  
Я догадываюсь, что это какая-то особенность работы nock, но упорно не догоняю, в чем именно дело. 

Я как только не переставлял вызовы nock(...).get()..., и в before.each, и отдельно мне тестов - работает только вот в таком виде, как сейчас. Где что идет не так?

*/

const { screen } = testingLibraryDom;

beforeEach(async () => {
  const initHtml = readFileSync('index.html').toString();
  document.body.innerHTML = initHtml;
  nock.disableNetConnect();
  await app();
});

test('network error', async () => {
  const input = screen.getByRole('textbox', { name: 'url' });
  const button = screen.getByRole('button', { name: 'add' });
  userEvent.type(input, 'https://ru.hexlet.io/lessons.rss');
  userEvent.click(button);
  await screen.findByText('Ошибка сети');
});

test('valid RSS1', async () => {
  const rssSource1 = readFileSync(rssExamplePath1, 'utf-8');
  nock('https://hexlet-allorigins.herokuapp.com')
    .get(/example1.rss/)
    .reply(200, { contents: rssSource1 });

  const input = screen.getByRole('textbox', { name: 'url' });
  const button = screen.getByRole('button', { name: 'add' });
  userEvent.type(input, 'https://ru.hexlet.io/example1.rss');
  userEvent.click(button);
  await screen.findByText('RSS успешно загружен');
});

test('valid RSS2', async () => {
  const rssSource2 = readFileSync(rssExamplePath2, 'utf-8');
  nock('https://hexlet-allorigins.herokuapp.com')
    .get(/example2.rss/)
    .reply(200, { contents: rssSource2 });

  const input = screen.getByRole('textbox', { name: 'url' });
  const button = screen.getByRole('button', { name: 'add' });
  userEvent.type(input, 'https://ru.hexlet.io/example2.rss');
  userEvent.click(button);
  await screen.findByText('RSS успешно загружен');
});

test('url exists', async () => {
  nock.cleanAll();
  const rssSource1 = readFileSync(rssExamplePath1, 'utf-8');
  nock('https://hexlet-allorigins.herokuapp.com')
    .get(/exists.rss/)
    .reply(200, { contents: rssSource1 });

  const input = screen.getByRole('textbox', { name: 'url' });
  const button = screen.getByRole('button', { name: 'add' });
  userEvent.type(input, 'https://ru.hexlet.io/exists.rss');
  userEvent.click(button);
  await screen.findByText('RSS успешно загружен');

  userEvent.type(input, 'https://ru.hexlet.io/exists.rss');
  userEvent.click(button);
  await screen.findByText('RSS уже существует');
});

test('invalid RSS', async () => {
  nock('https://hexlet-allorigins.herokuapp.com')
    .get(/examplehtmlpage/)
    .reply(200, document.body.innerHTML);
  const input = screen.getByRole('textbox', { name: 'url' });
  const button = screen.getByRole('button', { name: 'add' });
  userEvent.type(input, 'https://examplehtmlpage.com/');
  userEvent.click(button);
  await screen.findByText('Ресурс не содержит валидный RSS');
});

test('invalid input', async () => {
  const input = screen.getByRole('textbox', { name: 'url' });
  const button = screen.getByRole('button', { name: 'add' });
  userEvent.type(input, 'rss');
  userEvent.click(button);
  await screen.findByText('Ссылка должна быть валидным URL');
});
