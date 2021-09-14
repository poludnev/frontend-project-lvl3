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
      feeds: [],
      posts: [],
    };

    const watchedState = onChange(state, (path, current) => {
      if (path === 'rssRequestingProcess.errors' && current.length > 0) {
        const errorsTexts = {
          invalidURL: locales('errors.invalidURL'),
          urlExists: locales('errors.urlExists'),
          invalidRSS: locales('errors.invalidRSS'),
          networkError: locales('errors.networkError'),
        };
        viewHandlers.error(current, errorsTexts);
      }
      if (path === 'rssRequestingProcess.state') {
        const feedbackMessages = {
          success: locales('feedback.success'),
        };
        viewHandlers[current](feedbackMessages);
      }
      if (path === 'feeds') {
        const feedsTexts = {
          title: locales('feeds.title'),
        };
        viewHandlers.feeds(current, feedsTexts);
      }
      if (path === 'posts') {
        const postsTexts = {
          title: locales('posts.title'),
          previewButton: locales('posts.previewButton'),
        };
        viewHandlers.posts(current, postsTexts);

        const postsBlock = document.querySelector('.posts');
        console.log(postsBlock);

        postsBlock.addEventListener('click', (e) => {
          // e.preventDefault();
          console.log(e);
          console.log(e.target);
          e.target.classList.remove('fw-bold');
          e.target.classList.add('fw-normal', 'link-secondary');
          const post = _.find(watchedState.posts, { id: Number(e.target.dataset.id) });
          post.visited = true;
        });

        // const postsLinks = document.querySelectorAll('.posts a');
        // postsLinks.forEach((link) =>
        //   link.addEventListener('click', (e) => {
        //     e.target.classList.remove('fw-bold');
        //     e.target.classList.add('fw-normal', 'link-secondary');
        //     const post = _.find(watchedState.posts, { id: Number(e.target.dataset.id) });
        //     post.visited = true;
        //   }),
        // );
      }
    });

    viewHandlers.initial(locales);

    const feedsUpdate = () => {
      const { feeds } = watchedState;
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
                if (!_.find(postByFeedId, { title })) {
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
      // console.log('button clicked');
      const inputValue = event.target.elements.url.value;
      // console.log('input value:', inputValue);

      schema
        .validate({ url: inputValue })
        .then(({ url }) => {
          // console.log('somthing started', url);
          // console.log('state', watchedState.feeds);
          if (_.find(watchedState.feeds, { link: url })) throw new Error('urlExists');

          watchedState.rssRequestingProcess.state = 'requesting';
          return axios.get(
            `https://hexlet-allorigins.herokuapp.com/get?disableCache=true&url=${encodeURIComponent(
              url,
            )}`,
          );
        })
        .then((response) => {
          // console.log('response: ', response);
          const feed = rssParser(response.data.contents);
          const feedId = watchedState.feeds.length;
          watchedState.feeds.push({
            title: feed.title,
            description: feed.description,
            link: inputValue,
            id: feedId,
          });

          // feed.items.forEach(({ title, link, description }) =>
          //   watchedState.posts.push({
          //     title,
          //     link,
          //     description,
          //     feedId,
          //     id: watchedState.posts.length,
          //     visited: false,
          //   }),
          // );

          const posts = feed.items.map(({ title, link, description }) => ({
            title,
            link,
            description,
            feedId,
            id: watchedState.posts.length,
            visited: false,
          }));

          watchedState.posts.push(...posts);

          watchedState.rssRequestingProcess.errors = [];
          watchedState.rssRequestingProcess.state = 'success';
          // console.log(watchedState);
        })
        .catch((e) => {
          // console.log('error occured');
          watchedState.rssRequestingProcess.state = 'invalid';
          watchedState.rssRequestingProcess.errors.push(e);
        });
    });

    const modal = document.querySelector('.modal');
    modal.addEventListener('show.bs.modal', (e) => {
      const clickedButtonId = Number(e.relatedTarget.getAttribute('data-id'));
      const clickedPost = _.find(watchedState.posts, { id: clickedButtonId });
      clickedPost.visited = true;
      viewHandlers.modal(clickedPost);
    });
  });
