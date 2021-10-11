import _ from 'lodash';
import onChange from 'on-change';
import axios from 'axios';
import i18next from 'i18next';
import validateURL from './validator.js';
import view from './view.js';
import rssParser from './rssParser.js';
import ru from './locales/ru.js';
import validatorLocale from './locales/yupLocale.js';

import 'bootstrap/dist/js/bootstrap.min.js';

const addProxy = (url) => {
  const base = 'https://hexlet-allorigins.herokuapp.com/get?disableCache=true&url=';
  return `${base}${encodeURIComponent(url)}`;
};

const feedsUpdate = (state, delay) => {
  const { feeds } = state;
  const newFeeds = feeds.map(({ link: url, id }) => axios
    .get(addProxy(url))
    .then((response) => {
      const postsByFeedId = [...state.posts].filter((elem) => elem.feedId === id);
      const { items } = rssParser(response.data.contents);
      const newItems = _.differenceWith(
        items,

        postsByFeedId,
        (item, post) => item.title === post.title,
      );
      state.posts.push(...newItems);
    })
    .catch((e) => {
      state.requestingProcess.requestingState = 'failed';
      state.requestingProcess.errors.push(e);
    }));

  return Promise.all([...newFeeds]).then(setTimeout(() => feedsUpdate(state, delay), delay));
};

const feedUpdateDelay = 5000;

const request = (url, state) => axios.get(addProxy(url)).then((response) => {
  const feed = rssParser(response.data.contents);
  const feedId = _.uniqueId();
  const posts = feed.items.map(({ title, link, description }) => ({
    title,
    link,
    description,
    feedId,
    id: Number(_.uniqueId()),
    visited: false,
  }));
  state.feeds.push({
    title: feed.title,
    description: feed.description,
    link: url,
    id: feedId,
  });
  state.posts.push(...posts);
  state.requestingProcess.requestingState = 'success';
  state.requestingProcess.errors = [];
});

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

    const state = {
      form: {
        validationState: 'valid',
        errors: [],
      },
      requestingProcess: {
        requestingState: 'initial',
        errors: [],
      },
      feeds: [],
      posts: [],
      uiState: {
        visitedPosts: [],
        popup: { postId: null },
      },
    };

    view(state, 'form.validationState', 'initial', locales);

    const watchedState = onChange(state, (path, current) => {
      view(watchedState, path, current, locales);
    });

    feedsUpdate(watchedState, feedUpdateDelay);

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const formData = new FormData(event.target);
      const inputValue = formData.get('url');
      const feedsLinks = [...watchedState.feeds].map(({ link }) => link);

      validateURL(feedsLinks, inputValue, validatorLocale)
        .then(({ url }) => {
          watchedState.form.validationState = 'valid';
          watchedState.form.errors = [];
          watchedState.requestingProcess.requestingState = 'requesting';
          return request(url, watchedState);
        })
        .catch((e) => {
          if (e.name === 'ValidationError') {
            watchedState.form.validationState = 'invalid';
            watchedState.form.errors.push(e);
          } else {
            watchedState.requestingProcess.requestingState = 'failed';
            watchedState.requestingProcess.errors.push(e);
          }
        });
    });

    postsBlock.addEventListener('click', (e) => {
      if (!('id' in e.target.dataset)) return;
      const id = Number(e.target.dataset.id);
      watchedState.uiState.visitedPosts.push(id);
      watchedState.uiState.popup.postId = id;
    });
  });
