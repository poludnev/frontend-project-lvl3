import _ from 'lodash';
import onChange from 'on-change';
import axios from 'axios';
import i18next from 'i18next';
import * as yup from 'yup';
import render from './view.js';
import parseXmlToDom from './rssParser.js';
import ru from './locales/ru.js';
import yupLocales from './locales/yupLocale.js';
import 'bootstrap/dist/js/bootstrap.min.js';

const validateURL = (values, url) => yup
  .object()
  .shape({
    url: yup.string().required().url().notOneOf(values),
  })
  .validate({ url });

const addProxy = (url) => {
  const base = 'https://hexlet-allorigins.herokuapp.com/get?disableCache=true&url=';
  return `${base}${encodeURIComponent(url)}`;
};

const updateFeedsDelay = 5000;
const updateFeeds = (state) => {
  const { feeds } = state;
  const newFeeds = feeds.map(({ link: url, id }) => axios
    .get(addProxy(url))
    .then((response) => {
      const oldPosts = [...state.posts].filter((post) => post.feedId === id);
      const { items } = parseXmlToDom(response.data.contents);
      const newPosts = _.differenceWith(
        items,
        oldPosts,
        (item, post) => item.title === post.title,
      ).map((post) => ({ ...post, feedId: id, id: Number(_.uniqueId()) }));

      state.posts.push(...newPosts);
    })
    .catch((e) => {
      console.error(e);
    }));

  return Promise.all([...newFeeds]).then(setTimeout(() => updateFeeds(state), updateFeedsDelay));
};

const loadRSS = (url, state) => {
  state.requestingProcess.state = 'requesting';
  return axios
    .get(addProxy(url))
    .then((response) => {
      const feed = parseXmlToDom(response.data.contents);
      const feedId = Number(_.uniqueId());
      const posts = feed.items.map(({ title, link, description }) => ({
        title,
        link,
        description,
        feedId,
        id: Number(_.uniqueId()),
      }));
      state.feeds.push({
        title: feed.title,
        description: feed.description,
        link: url,
        id: feedId,
      });
      state.posts.push(...posts);
      state.requestingProcess.state = 'success';
      state.requestingProcess.errors.length = 0;
    })
    .catch((e) => {
      state.requestingProcess.state = 'failed';
      state.requestingProcess.errors.push(e);
    });
};

export default () => i18next
  .init({
    lng: 'ru',
    resources: {
      ru,
    },
  })
  .then((locales) => {
    const form = document.querySelector('form');
    const postsBlock = document.querySelector('.posts');

    yup.setLocale(yupLocales);

    const state = {
      form: {
        validationState: 'valid',
        errors: [],
      },
      requestingProcess: {
        state: 'initial',
        errors: [],
      },
      feeds: [],
      posts: [],
      uiState: {
        visitedPosts: new Set(),
        popup: { postId: null },
      },
    };

    render(state, 'form.validationState', 'initial', locales);

    const watchedState = onChange(state, (path, current) => {
      render(watchedState, path, current, locales);
    });

    updateFeeds(watchedState, updateFeedsDelay);

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const formData = new FormData(event.target);
      const url = formData.get('url');
      const feedsLinks = [...watchedState.feeds].map(({ link }) => link);

      validateURL(feedsLinks, url)
        .then(({ url: validUrl }) => {
          watchedState.form.validationState = 'valid';
          watchedState.form.errors.length = 0;
          return loadRSS(validUrl, watchedState);
        })
        .catch((e) => {
          watchedState.form.validationState = 'invalid';
          watchedState.form.errors.push(e);
        });
    });

    postsBlock.addEventListener('click', (e) => {
      if (!('id' in e.target.dataset)) return;
      const id = Number(e.target.dataset.id);
      watchedState.uiState.visitedPosts.add(id);
      watchedState.uiState.popup.postId = id;
    });
  });
