import _ from 'lodash';
import onChange from 'on-change';
import axios from 'axios';
import i18next from 'i18next';
import validateURL from './validator.js';
import viewHandlers from './viewHandlers.js';
import rssParser from './rssParser.js';
import ru from './locales/ru.js';

import 'bootstrap/dist/js/bootstrap.min.js';

const addProxy = (url) => {
  const base = 'https://hexlet-allorigins.herokuapp.com/get?disableCache=true&url=';
  return `${base}${encodeURIComponent(url)}`;
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

    const state = {
      rssRequestingProcess: {
        validationState: 'valid',
        state: 'initial',
        errors: [],
      },
      modal: {
        title: '',
        description: '',
        link: '',
        id: null,
        postId: null,
      },
      feeds: [],
      posts: [],
      uiState: {
        visitedPosts: [],
        popup: { postId: null },
      },
    };

    const watchedState = onChange(state, (path, current) => {
      console.log('path', path);
      if (path === 'rssRequestingProcess.errors' && current.length > 0) {
        console.log('watched state errors', current);
        const errorsTexts = {
          invalidURL: locales('errors.invalidURL'),
          urlExists: locales('errors.urlExists'),
          invalidRSS: locales('errors.invalidRSS'),
          networkError: locales('errors.networkError'),
        };
        viewHandlers.handleErrors(current, errorsTexts);
      }
      if (path === 'rssRequestingProcess.state') {
        const feedbackMessages = {
          success: locales('feedback.success'),
        };
        if (current === 'requesting') {
          viewHandlers.renderRequest(feedbackMessages);
        }
        if (current === 'invalid') {
          viewHandlers.renderInvalid(feedbackMessages);
        }
        if (current === 'success') {
          viewHandlers.renderSuccess(feedbackMessages);
        }
      }
      if (path === 'feeds') {
        const feedsTexts = {
          title: locales('feeds.title'),
        };
        viewHandlers.renderFeeds(current, feedsTexts);
      }
      if (path === 'posts') {
        const postsTexts = {
          title: locales('posts.title'),
          previewButton: locales('posts.previewButton'),
        };
          // console.log(watchedState.uiState.visitedPosts);
        viewHandlers.renderPosts(current, postsTexts, watchedState.uiState.visitedPosts);
      }
      if (path === 'uiState.visitedPosts') {
        // console.log('uiState visited posts', current);
        viewHandlers.updatePostsUI(current);
      }
      if (path === 'uiState.popup.postId') {
        console.log('path modal');
        viewHandlers.renderPopup(watchedState);
      }
    });

    viewHandlers.initialise(locales);

    const feedsUpdate = () => {
      const { feeds } = watchedState;
      if (feeds.length > 0) {
        feeds.forEach(({ link: url, id }) => {
          axios.get(addProxy(url)).then((response) => {
            const postsByFeedId = [...watchedState.posts].filter((elem) => elem.feedId === id);

            const { items } = rssParser(response.data.contents);

            const newItems = _.differenceWith(
              items,
              postsByFeedId,
              (item, post) => item.title === post.title,
            );

            watchedState.posts.push(...newItems);
          });
        });
      }
      const timeOutDelay = 5000;
      return setTimeout(feedsUpdate, timeOutDelay);
    };

    feedsUpdate();

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const inputValue = event.target.elements.url.value;
      const feedsLinks = [...watchedState.feeds].map(({ link }) => link);

      validateURL(feedsLinks, inputValue)
        .then(({ url }) => {
          watchedState.rssRequestingProcess.state = 'requesting';
          return axios.get(addProxy(url));
        })
        .then((response) => {
          const feed = rssParser(response.data.contents);
          const feedId = watchedState.feeds.length;
          watchedState.feeds.push({
            title: feed.title,
            description: feed.description,
            link: inputValue,
            id: feedId,
          });

          const posts = feed.items.map(({ title, link, description }) => ({
            title,
            link,
            description,
            feedId,
            id: Number(_.uniqueId()),
            visited: false,
          }));

          watchedState.posts.push(...posts);

          watchedState.rssRequestingProcess.errors = [];
          watchedState.rssRequestingProcess.state = 'success';
        })
        .catch((e) => {
          watchedState.rssRequestingProcess.state = 'invalid';
          watchedState.rssRequestingProcess.errors.push(e);
        });
    });

    postsBlock.addEventListener('click', (e) => {
      console.log('post block click', e.target, e.target.type);
      const postId = Number(e.target.dataset.id);
      if (e.target.type === 'button') watchedState.uiState.popup.postId = postId;
      if (_.isNaN(postId) || watchedState.uiState.visitedPosts.includes(postId)) return;
      watchedState.uiState.visitedPosts.push(postId);
    });
  });
