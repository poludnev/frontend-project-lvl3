import _ from 'lodash';
import onChange from 'on-change';
import * as yup from 'yup';
import axios from 'axios';
import i18next from 'i18next';
import viewHandlers from './formViewHandlers.js';
import rssParser from './rssParser.js';
import ru from './locales/ru.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.min.js';

const isUrlExists = (url, state) => {
  // console.log('is url exist, state:', state.feeds);
  const x = _.find(state.feeds.data, { link: url });
  // console.log('is url exist', x);
  if (x) return true;
  return false;
};

// const runApp = async () => {
export default async () => {
  // console.log('app started');

  const i18nInstance = i18next.createInstance();

  await i18nInstance.init({
    lng: 'ru',
    resources: {
      ru,
    },
  });

  yup.setLocale({
    string: {
      url: () => ({
        name: 'invalidURL',
        value: i18nInstance.t('feedback.invalidInput'),
      }),
      // matcches: i18nInstance.t('feedback.invalidRSS'),
      matches: () => ({ name: 'invalidRSS', value: i18nInstance.t('feedback.invalidRSS') }),
    },
  });

  const schema = yup.object().shape({
    url: yup.string().url(),
    rss: yup.string().matches(/<rss /),
    status: yup.number().min(200).max(200),
  });

  const state = {
    formState: 'initial',
    feedbackMessage: '',
    errors: [],
    listData: [],
    feeds: {
      title: i18nInstance.t('feedsTitle'),
      lastsIndex: 0,
      data: [],
      addFeed(newFeed) {
        this.data.push({ ...newFeed, id: this.lastsIndex });
        this.lastsIndex += 1;
      },
    },
    posts: {
      title: i18nInstance.t('posts.title'),
      buttonsName: i18nInstance.t('posts.button'),
      lastsIndex: 0,
      data: [],
      addPost(newPost) {
        this.data.push({ ...newPost, id: this.lastsIndex, visited: false });
        this.lastsIndex += 1;
      },
    },
  };

  const watchedState = onChange(state, (path, current) => {
    // console.log('watchedState changes', path);
    if (path === 'formState') {
      // console.log('formState changed', `path: ${path}, current:
      // ${ current }, previous: ${ previous }`);
      viewHandlers[current](onChange.target(watchedState));
    }
    if (path === 'feeds') {
      // console.log('feeds changed');
      viewHandlers.feeds(current);
    }
    if (path === 'posts') {
      // console.log('posts changed');
      viewHandlers.posts(current);
      const a = document.querySelectorAll('.posts a');
      [...a].forEach((el) =>
        el.addEventListener('click', (e) => {
          e.target.classList.remove('fw-bold');
          e.target.classList.add('fw-normal', 'link-secondary');
          // console.log('a target', e.target, e.target.dataset.id);
          const post = _.find(watchedState.posts.data, { id: Number(e.target.dataset.id) });
          post.visited = true;
          // console.log('pist find', post);
        }),
      );
    }
  });

  const h1 = document.querySelector('h1');
  h1.innerHTML = i18nInstance.t('title');
  const lead = document.querySelector('.lead');
  lead.innerHTML = i18nInstance.t('lead');

  const inputLabel = document.querySelector('#url-input ~ label');
  inputLabel.innerHTML = i18nInstance.t('form.inputLabel');

  const inputButton = document.querySelector('form button');
  inputButton.innerHTML = i18nInstance.t('form.button');

  const sampleUrl = document.querySelector('form ~ p');
  sampleUrl.innerHTML = i18nInstance.t('sampleUrl');

  const footerLink = document.querySelector('footer a');
  footerLink.innerHTML = i18nInstance.t('footer.link');
  const footerText = footerLink.parentElement;
  footerText.childNodes[0].nodeValue = i18nInstance.t('footer.text');

  const feedsUpdate = () => {
    const feeds = onChange.target(watchedState.feeds.data);
    if (feeds.length > 0) {
      // console.log(feeds);
      feeds.forEach(({ link, id }) => {
        axios
          .get(
            `https://hexlet-allorigins.herokuapp.com/get?disableCache=true&url=${encodeURIComponent(
              link,
            )}`,
          )
          .then((response) => schema.validate({ status: response.status, response }))
          .then(({ response }) => {
            // console.log('response status validated', response);
            const postByFeedId = onChange
              .target(watchedState.posts.data)
              .filter((elem) => elem.feedId === id);
            // console.log(postByFeedId);
            const parsedRss = rssParser(response.data);
            const { posts } = parsedRss;

            posts.forEach((post) => {
              // console.log('checking the posts', post);
              // console.log(_.find(postByFeedId, { title: post.title }));
              if (!_.find(postByFeedId, { title: post.title })) {
                watchedState.posts.addPost({
                  title: post.title,
                  link: post.link,
                  description: post.description,
                  feedId: id,
                });
              }
            });
          });
      });
    }

    return setTimeout(feedsUpdate, 5000);
  };

  const form = document.querySelector('form');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    // console.log('log event', event);
    // console.log('log event target', event.target);
    // console.log('log event target.url', event.target.url);
    // console.log('log event target.elements', event.target.elements);
    // console.log('log event target.elements.url', event.target.elements.url);
    // console.log('log event target.elements.url', event.target.elements.url.value);
    // console.log('log event target', event.target[0].value);

    // const formData = new FormData(form);
    // console.log('form data', formData);
    const inputValue = event.target.elements.url.value;

    if (isUrlExists(inputValue, watchedState)) {
      watchedState.feedbackMessage = i18nInstance.t('feedback.urlExists');
      watchedState.formState = 'urlExists';
      return;
    }

    schema
      .validate({ url: inputValue })
      .then(({ url }) => {
        // console.log('schema validation', url);
        watchedState.formState = 'requesting';
        return axios.get(
          `https://hexlet-allorigins.herokuapp.com/get?disableCache=true&url=${encodeURIComponent(
            url,
          )}`,
        );
      })
      .then((httpResponse) => {
        // console.log('after axios', httpResponse);
        return schema.validate({ rss: httpResponse.data.contents, httpResponse });
      })
      .then(({ httpResponse }) => {
        // console.log('rss valid', httpResponse);
        // console.log('rss valid');
        const parsedRss = rssParser(httpResponse.data);
        // console.log('parsed rss', parsedRss);

        const { feed, posts } = parsedRss;

        watchedState.feeds.addFeed({ ...feed, link: inputValue });

        posts.forEach(({ title, link, description }) =>
          watchedState.posts.addPost({
            title,
            link,
            description,
            feedId: watchedState.feeds.lastsIndex - 1,
          }),
        );

        watchedState.errors = [];
        watchedState.feedbackMessage = i18nInstance.t('feedback.success');
        watchedState.formState = 'success';
        // x1();
      })
      .catch((e) => {
        // console.log('error in catch', e);
        // const netError = /Network Error/g.exec(e);
        if (!e) return;
        watchedState.errors.push(e);
        if (/Network Error/g.exec(e)) {
          watchedState.feedbackMessage = 'Ошибка сети';
          watchedState.formState = 'networkError';
          return;
        }
        watchedState.feedbackMessage = e.errors[0].value;
        watchedState.formState = e.errors[0].name;
      });
  });
  feedsUpdate();

  const modal = document.querySelector('.modal');
  modal.addEventListener('show.bs.modal', (e) => {
    const button = e.relatedTarget;
    const buttonId = Number(button.getAttribute('data-id'));
    const modalTitle = document.querySelector('.modal-title');
    const post = _.find(watchedState.posts.data, { id: buttonId });
    post.visited = true;
    const a = document.querySelector(`[data-id="${buttonId}"]`);
    // console.log('aaa', a);
    a.classList.remove('fw-bold');
    a.classList.add('fw-normal', 'link-secondary');
    // console.log('a target', e.target, e.target.dataset.id);
    modalTitle.innerHTML = post.title;
    const modalBody = document.querySelector('.modal-body');
    modalBody.innerHTML = post.description;
    const fullArticle = document.querySelector('.full-article');
    fullArticle.href = post.link;
    fullArticle.textContent = i18nInstance.t('modal.readButton');
    const closeButton = document.querySelector('.modal-footer button');
    closeButton.textContent = i18nInstance.t('modal.closeButton');
  });
};

// runApp();
