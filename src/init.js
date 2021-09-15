// import { find } from 'lodash';
import _ from 'lodash';
import onChange from 'on-change';
import * as yup from 'yup';
import axios from 'axios';
import i18next from 'i18next';
import viewHandlers from './viewHandlers.js';
import rssParser from './rssParser.js';
import ru from './locales/ru.js';
import 'bootstrap/dist/js/bootstrap.min.js';

const encodeURL = (url) => {
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
    yup.setLocale({
      string: {
        url: () => 'invalidURL',
      },
    });

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
      },
      feeds: [],
      posts: [],
      uiState: {
        visitedPosts: [],
      },
    };

    const watchedState = onChange(state, (path, current) => {
      if (path === 'rssRequestingProcess.errors' && current.length > 0) {
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
        viewHandlers.renderPosts(current, postsTexts, watchedState.uiState.visitedPosts);
      }
      if (path === 'uiState.visitedPosts') {
        viewHandlers.updatePostsUI(current);
      }
      if (path === 'modal') {
        viewHandlers.renderModal(current);
      }
    });

    viewHandlers.initialise(locales);

    const feedsUpdate = () => {
      const { feeds } = watchedState;
      if (feeds.length > 0) {
        feeds.forEach(({ link: url, id }) => {
          axios.get(encodeURL(url)).then((response) => {
            const filtredPosts = [...watchedState.posts].filter((elem) => elem.feedId === id);

            const { items } = rssParser(response.data.contents);

            const newItems = items
              .filter(({ title }) => !_.find(filtredPosts, { title }))
              .map(({ title, link, description }) => ({
                title,
                link,
                description,
                feedsId: id,
                id: Number(_.uniqueId()),
                visited: false,
              }));

            watchedState.posts.push(...newItems);
          });
        });
      }
      return setTimeout(feedsUpdate, 5000);
    };

    feedsUpdate();

    const form = document.querySelector('form');
    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const inputValue = event.target.elements.url.value;
      const feedsLinks = [...watchedState.feeds].map(({ link }) => link);

      yup
        .object()
        .shape({
          url: yup
            .string()
            .url()
            .notOneOf(feedsLinks, () => 'urlExists'),
        })
        .validate({ url: inputValue })
        .then(({ url }) => {
          watchedState.rssRequestingProcess.state = 'requesting';
          return axios.get(encodeURL(url));
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

    const modal = document.querySelector('.modal');
    modal.addEventListener('show.bs.modal', (e) => {
      const clickedButtonId = Number(e.relatedTarget.getAttribute('data-id'));
      const clickedPost = _.find(watchedState.posts, { id: clickedButtonId });
      clickedPost.visited = true;
      const {
        title, description, link, id,
      } = clickedPost;
      watchedState.modal = {
        title,
        description,
        link,
        id,
      };
    });

    const postsBlock = document.querySelector('.posts');
    postsBlock.addEventListener('click', (e) => {
      e.target.classList.remove('fw-bold');
      e.target.classList.add('fw-normal', 'link-secondary');
      const postId = Number(e.target.dataset.id);
      watchedState.uiState.visitedPosts.push(postId);
    });
  });
