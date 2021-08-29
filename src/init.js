import { find } from 'lodash';
import onChange from 'on-change';
import * as yup from 'yup';
import axios from 'axios';
import i18next from 'i18next';
import viewHandlers from './viewHandlers.js';
import rssParser from './rssParser.js';
import ru from './locales/ru.js';
import 'bootstrap/dist/js/bootstrap.min.js';

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

    const schema = yup.object().shape({
      url: yup.string().url(),
    });

    const state = {
      rssRequestingProcess: {
        validationState: 'valid',
        state: 'initial',
        errors: [],
      },
      feedbackMessage: '',
      errors: [],
      texts: {
        feeds: locales('feedsTitle'),
        posts: locales('posts.title'),
        postButton: locales('posts.button'),
        successMessage: locales('feedback.success'),
        errors: {
          invalidURL: locales('errors.invalidURL'),
          urlExists: locales('errors.urlExists'),
          invalidRSS: locales('errors.invalidRSS'),
          networkError: locales('errors.networkError'),
        },
      },
      feeds: [],
      posts: [],
    };

    const watchedState = onChange(state, (path, current) => {
      if (path === 'errors' && current.length > 0) {
        viewHandlers.error(onChange.target(watchedState));
        watchedState.rssRequestingProcess.state = 'invalid';
      }
      if (path === 'formState') {
        viewHandlers[current](onChange.target(watchedState));
      }
      if (path === 'rssRequestingProcess.state') {
        viewHandlers[current](onChange.target(watchedState));
      }
      if (path === 'feeds') {
        viewHandlers.feeds(onChange.target(watchedState));
      }
      if (path === 'posts') {
        viewHandlers.posts(onChange.target(watchedState));
        const postsLinks = document.querySelectorAll('.posts a');
        postsLinks.forEach((link) => link.addEventListener('click', (e) => {
          e.target.classList.remove('fw-bold');
          e.target.classList.add('fw-normal', 'link-secondary');
          const post = find(watchedState.posts, { id: Number(e.target.dataset.id) });
          post.visited = true;
        }));
      }
    });

    viewHandlers.initial(locales, state);

    const feedsUpdate = () => {
      const feeds = onChange.target(watchedState.feeds);
      if (feeds.length > 0) {
        feeds.forEach(({ link: url, id }) => {
          axios
            .get(
              `https://hexlet-allorigins.herokuapp.com/get?disableCache=true&url=${encodeURIComponent(
                url,
              )}`,
            )
            .then((response) => schema.validate({ status: response.status, response }))
            .then(({ response }) => {
              const postByFeedId = onChange
                .target(watchedState.posts)
                .filter((elem) => elem.feedId === id);
              const { items } = rssParser(response.data.contents);
              items.forEach(({ title, link, description }) => {
                if (!find(postByFeedId, { title })) {
                  watchedState.posts.push({
                    title,
                    link,
                    description,
                    feedId: id,
                    id: watchedState.posts.length,
                    visited: false,
                  });
                }
              });
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

      schema
        .validate({ url: inputValue })
        .then(({ url }) => {
          if (find(watchedState.feeds, { link: url })) throw new Error('urlExists');

          watchedState.rssRequestingProcess.state = 'requesting';
          return axios.get(
            `https://hexlet-allorigins.herokuapp.com/get?disableCache=true&url=${encodeURIComponent(
              url,
            )}`,
          );
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

          feed.items.forEach(({ title, link, description }) => watchedState.posts.push({
            title,
            link,
            description,
            feedId,
            id: watchedState.posts.length,
            visited: false,
          }));

          watchedState.errors = [];
          watchedState.rssRequestingProcess.state = 'success';
        })
        .catch((e) => {
          watchedState.errors.push(e);
        });
    });

    const modal = document.querySelector('.modal');
    modal.addEventListener('show.bs.modal', (e) => {
      const clickedButtonId = Number(e.relatedTarget.getAttribute('data-id'));
      const clickedPost = find(watchedState.posts, { id: clickedButtonId });
      clickedPost.visited = true;
      viewHandlers.modal(clickedPost);
    });
  });
