import _ from 'lodash';
import axios from 'axios';
import i18next from 'i18next';
import * as yup from 'yup';
import view from './view.js';
import parse from './rssParser.js';
import ru from './locales/ru.js';
import yupLocales from './locales/yupLocale.js';
import 'bootstrap/dist/js/bootstrap.js';

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
      const { items } = parse(response.data.contents);
      const newPosts = _.differenceWith(
        items,
        oldPosts,
        (item, post) => item.title === post.title,
      ).map((post) => ({ ...post, feedId: id, id: Number(_.uniqueId()) }));

      state.posts.unshift(...newPosts);
    })
    .catch((e) => {
      console.error(e);
    }));

  return Promise.all([...newFeeds]).then(setTimeout(() => updateFeeds(state), updateFeedsDelay));
};

const loadRSS = (url, state) => {
  // console.log('loadRss started');
  state.requestingProcess.error = null;
  state.requestingProcess.state = 'requesting';
  // console.log('loadRss started 2');
  // state.form.validationState = 'blocked';
  return axios
    .get(addProxy(url))
    .then((response) => {
      // console.log('axios valid');
      const feed = parse(response.data.contents);
      const feedId = Number(_.uniqueId());
      const posts = feed.items.map(({ title, link, description }) => ({
        title,
        link,
        description,
        feedId,
        id: Number(_.uniqueId()),
      }));
      state.feeds.unshift({
        title: feed.title,
        description: feed.description,
        link: url,
        id: feedId,
      });
      state.posts.unshift(...posts);
      state.requestingProcess.error = null;
      state.requestingProcess.state = 'success';
      // state.form.validationState = 'initial';
    })
    .catch((e) => {
      // console.log('axios invalid');
      state.requestingProcess.error = e;
      state.requestingProcess.state = 'failed';
      // state.form.validationState = 'invalid';
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

    const elements = {
      title: document.querySelector('h1'),
      lead: document.querySelector('.lead'),
      feedback: document.querySelector('.feedback'),
      input: document.querySelector('input'),
      inputLabel: document.querySelector('#url-input ~ label'),
      button: document.querySelector('form button'),
      sampleUrl: document.querySelector('form ~ p'),
      feedsContainer: document.querySelector('.feeds'),
      postsContainer: document.querySelector('.posts'),
      modalTitle: document.querySelector('.modal-title'),
      modalBody: document.querySelector('.modal-body'),
      modalArticleLink: document.querySelector('.full-article'),
      modalCloseButton: document.querySelector('.modal-footer button'),
      footerTextContainer: document.querySelector('.footer .text-center'),
      hexletLink: document.createElement('a'),
    };

    yup.setLocale(yupLocales);

    const state = {
      form: {
        validationState: 'valid',
        error: null,
      },
      requestingProcess: {
        state: 'initial',
        error: null,
      },
      feeds: [],
      posts: [],
      uiState: {
        visitedPosts: new Set(),
        popup: { postId: null },
      },
    };

    const watchedState = view(state, locales, elements);

    updateFeeds(watchedState);

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      // console.log('submitted');

      const formData = new FormData(event.target);
      const url = formData.get('url');
      const feedsLinks = [...watchedState.feeds].map(({ link }) => link);

      // console.log(formData);

      validateURL(feedsLinks, url)
        .then(({ url: validUrl }) => {
          watchedState.form.error = null;
          watchedState.form.validationState = 'valid';
          // console.log('validated')
          return loadRSS(validUrl, watchedState);
        })
        .catch((e) => {
          watchedState.form.validationState = 'invalid';
          watchedState.form.error = e;
        });
    });

    postsBlock.addEventListener('click', (e) => {
      if (!('id' in e.target.dataset)) return;
      const id = Number(e.target.dataset.id);
      watchedState.uiState.visitedPosts.add(id);
      watchedState.uiState.popup.postId = id;
    });
  });
