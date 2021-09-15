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
const rssSource = readFileSync(xmlExamplePath1, 'utf-8');

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

const createNockScope = (scope) => {
  if (!scope) return;
  nock('https://hexlet-allorigins.herokuapp.com').get(scope.path).reply(200, scope.replyData);
};

beforeEach(async () => {
  const initHtml = readFileSync('index.html').toString();
  document.body.innerHTML = initHtml;
  nock.disableNetConnect();
  await app();
});

afterEach(() => {
  nock.cleanAll();
});

const testTitles = ['network error', 'input invalid', 'RSS invalid'];

const scopes = {
  invalidRSS: { path: /examplehtmlpage/, replyData: document.body.innerHTML },
  validRSS: { path: /example.rss/, replyData: { contents: rssSource } },
};

const urls = ['https://ru.hexlet.io/lessons.rss', 'https://rss', 'https://examplehtmlpage.com/'];

test.each`
  testTitle        | scope                | url        | queryText   | messageText
  ${testTitles[0]} | ${null}              | ${urls[0]} | ${/Ошибка/} | ${'Ошибка сети'}
  ${testTitles[1]} | ${null}              | ${urls[1]} | ${/Ссылка/} | ${'Ссылка должна быть валидным URL'}
  ${testTitles[2]} | ${scopes.invalidRSS} | ${urls[2]} | ${/Ресурс/} | ${'Ресурс не содержит валидный RSS'}
`('When $testTitle', async ({
  scope, url, queryText, messageText,
}) => {
  createNockScope(scope);
  const input = screen.getByRole('textbox', { name: 'url' });
  const button = screen.getByRole('button', { name: 'add' });
  userEvent.type(input, url);
  userEvent.click(button);
  const feedback = await screen.findByText(queryText, { selector: '.feedback' });
  expect(feedback).toHaveTextContent(messageText);
});

test('when RSS is valid and modal', async () => {
  createNockScope(scopes.validRSS);

  const input = screen.getByRole('textbox', { name: 'url' });
  const button = screen.getByRole('button', { name: 'add' });
  userEvent.type(input, 'https://ru.hexlet.io/example.rss');
  userEvent.click(button);

  await screen.findByText('RSS успешно загружен');
  await screen.findByText('HTTP / Java: Веб-технологии');
  await screen.findByText('Search Forms / Ruby: Реальный Rails');

  const viewButtons = screen.getAllByText('Просмотр');
  viewButtons[0].click();

  const modalTitle = await screen.findByText(/.*/, { selector: '.modal-title' });
  const modalBody = await screen.findByText(/.*/, { selector: '.modal-body' });

  expect(modalTitle).toHaveTextContent(parsedRSS1.items[0].title);
  expect(modalBody).toHaveTextContent(parsedRSS1.items[0].description);
});

test('When url already exists', async () => {
  createNockScope(scopes.validRSS);

  const input = screen.getByRole('textbox', { name: 'url' });
  const button = screen.getByRole('button', { name: 'add' });
  userEvent.type(input, 'https://ru.hexlet.io/example.rss');
  userEvent.click(button);

  let feedback = await screen.findByText(/.{1,}/, { selector: '.feedback' });
  expect(feedback).toHaveTextContent('RSS успешно загружен');

  userEvent.type(input, 'https://ru.hexlet.io/example.rss');
  userEvent.click(button);

  setTimeout(async () => {
    feedback = await screen.findByText(/.{1,}/, { selector: '.feedback' });
    expect(feedback).toHaveTextContent('RSS уже существует');
  }, 100);
});
