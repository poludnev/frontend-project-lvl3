import { readFileSync } from 'fs';
import { expect, test } from '@jest/globals';
import nock from 'nock';
import axios from 'axios';
import '@testing-library/jest-dom';
import testingLibraryDom from '@testing-library/dom';
import defaultAdapter from 'axios/lib/adapters/http';
import testingLibraryUserEvent from '@testing-library/user-event';
import rssParser from '../src/rssParser.js';
import app from '../src/init.js';

axios.defaults.adapter = defaultAdapter;
const userEvent = testingLibraryUserEvent.default;
const { screen } = testingLibraryDom;

const getFixturePath = (filename) => `__fixtures__/${filename}`;

const xmlExamplePath1 = getFixturePath('xmlExample1.txt');
const xmlExamplePath2 = getFixturePath('xmlExample2.txt');

const parsedResultPath1 = getFixturePath('rssResult1.json');
const parsedResultPath2 = getFixturePath('rssResult2.json');

const parsedRSS1 = JSON.parse(readFileSync(parsedResultPath1, 'utf-8'));
// const parsedRSS2 = JSON.parse(readFileSync(parsedResultPath2, 'utf-8'));

test.each`
  sourcePath         | resultPath           | structureName
  ${xmlExamplePath1} | ${parsedResultPath1} | ${'structure 1'}
  ${xmlExamplePath2} | ${parsedResultPath2} | ${'structure 2'}
`('When rss structure is the $structureName', ({ sourcePath, resultPath }) => {
  const result = readFileSync(resultPath, 'utf-8');
  const expected = JSON.parse(result);
  const source = readFileSync(sourcePath, 'utf-8');
  expect(rssParser(source)).toEqual(expected);
});

beforeEach(async () => {
  const initHtml = readFileSync('index.html').toString();
  document.body.innerHTML = initHtml;
  nock.disableNetConnect();
  await app();
});

afterEach(() => {
  // console.log(nock.activeMocks());
  nock.cleanAll();
  nock.enableNetConnect();
});

test('network error', async () => {
  const input = screen.getByRole('textbox', { name: 'url' });
  const button = screen.getByRole('button', { name: 'add' });
  userEvent.type(input, 'https://ru.hexlet.io/lessons.rss');
  userEvent.click(button);
  const feedback = await screen.findByText(/Ошибка/, { selector: '.feedback' });
  expect(feedback.textContent).toBe('Ошибка сети');
});

test('invalid input', async () => {
  const input = screen.getByRole('textbox', { name: 'url' });
  const button = screen.getByRole('button', { name: 'add' });
  userEvent.type(input, 'rss');
  userEvent.click(button);
  const feedback = await screen.findByText(/Ссылка должна/, { selector: '.feedback' });
  expect(feedback.textContent).toBe('Ссылка должна быть валидным URL');
  // await screen.findByText('Ссылка должна быть валидным URL');
});

test('invalid RSS', async () => {
  nock('https://hexlet-allorigins.herokuapp.com')
    .get(/examplehtmlpage/)
    .reply(200, document.body.innerHTML);
  const input = screen.getByRole('textbox', { name: 'url' });
  const button = screen.getByRole('button', { name: 'add' });
  // console.log(nock.activeMocks());
  userEvent.type(input, 'https://examplehtmlpage.com/');
  userEvent.click(button);
  // console.log(nock.activeMocks());
  const feedback = await screen.findByText(/Ресурс/, {
    selector: '.feedback',
  });
  expect(feedback.textContent).toBe('Ресурс не содержит валидный RSS');
});

test('valid RSS 1', async () => {
  const rssSource1 = readFileSync(xmlExamplePath1, 'utf-8');
  nock('https://hexlet-allorigins.herokuapp.com')
    .get(/example1.rss/)
    .reply(200, { contents: rssSource1 });

  const input = screen.getByRole('textbox', { name: 'url' });
  const button = screen.getByRole('button', { name: 'add' });
  // console.log(nock.activeMocks());

  userEvent.type(input, 'https://ru.hexlet.io/example1.rss');
  userEvent.click(button);
  // console.log('01 nock is done', nock.isDone());
  await screen.findByText('RSS успешно загружен');
  await screen.findByText('HTTP / Java: Веб-технологии');
  await screen.findByText('Search Forms / Ruby: Реальный Rails');

  const viewButtons = screen.getAllByText('Просмотр');
  viewButtons[0].click();

  const modalTitle = await screen.findByText(/.*/, { selector: '.modal-title' });
  const modalBody = await screen.findByText(/.*/, { selector: '.modal-body' });

  expect(modalTitle.textContent).toEqual(parsedRSS1.items[0].title);
  expect(modalBody.textContent).toEqual(parsedRSS1.items[0].description);
});

test('valid RSS 2', async () => {
  const rssSource2 = readFileSync(xmlExamplePath2, 'utf-8');
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
  // nock.cleanAll();
  const rssSource1 = readFileSync(xmlExamplePath1, 'utf-8');
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
