import _ from 'lodash';
import onChange from 'on-change';
import * as yup from 'yup';
import axios from 'axios';
import viewHandlers from './formViewHandlers.js';
import rssParser from './rssParser.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.min.js';

const schema = yup.object().shape({
  url: yup.string().url(),
});

const httpRequest = (url) => axios.get(`https://hexlet-allorigins.herokuapp.com/get?url=${encodeURIComponent(url)}`);

const isValidRespond = (response) => {
  if (response.status === 200) return true;
  return false;
};

const isValidInput = (inputValue) => schema.isValid({ url: inputValue });

const isUrlExists = (url, state) => {
  // console.log('is url exist, state:', state.feeds);
  const x = _.find(state.feeds.data, { link: url });
  // console.log('is url exist', x);
  if (x) return true;
  return false;
};

const runApp = () => {
  console.log('app started');

  const state = {
    formState: 'initial',
    listData: [],
    feeds: {
      lastsIndex: 0,
      data: [],
      addFeed(newFeed) {
        this.data.push({ ...newFeed, id: this.lastsIndex });
        this.lastsIndex += 1;
      },
    },
    posts: {
      lastsIndex: 0,
      data: [],
      addPost(newPost) {
        this.data.push({ ...newPost, id: this.lastsIndex, visited: false });
        this.lastsIndex += 1;
      },
    },
  };

  const watchedState = onChange(state, (path, current, previous) => {
    if (path === 'formState') {
      console.log('formState changed', `path: ${path}, current: ${current}, previous: ${previous}`);
      viewHandlers[current]();
    }
    if (path === 'feeds') {
      console.log('feeds changed');
      viewHandlers.feeds(current);
    }
    if (path === 'posts') {
      console.log('posts changed');
      viewHandlers.posts(current);
    }
  });

  const form = document.querySelector('form');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const inputValue = event.target.url.value;
    // console.log('inputValue:', inputValue);
    // console.log('yup test', await schema.isValid({ url: inputValue }));
    isValidInput(inputValue).then((data) => {
      console.log('promise isValidInput', data);
      if (!data) {
        watchedState.formState = 'invalidInput';
        return;
      }
      if (isUrlExists(inputValue, watchedState)) {
        // case4: existing URL
        watchedState.formState = 'urlExists';
        return;
      }
      watchedState.formState = 'requesting';
      httpRequest(inputValue).then((response) => {
        console.log('http response', response);
        if (isValidRespond(response)) {
          // case5: success
          watchedState.formState = 'success';
          // console.log('resonse data', response.data);
          watchedState.listData.push(response.data);

          const { feed, posts } = rssParser(response.data);

          watchedState.feeds.addFeed(feed);

          posts.forEach(({ title, link, description }) => watchedState.posts.addPost({
            title,
            link,
            description,
            feedId: watchedState.feeds.lastsIndex - 1,
          }));
        }
      });
    });
    // if (await isValidInput(inputValue)) {
    //   // console.log('input string is valid url');

    //   // if (isUrlExists(inputValue, watchedState)) {
    //   //   // case4: existing URL
    //   //   watchedState.formState = 'urlExists';
    //   //   // console.log('case4 url exists, watchedState:', watchedState);
    //   //   return;
    //   // }

    //   // case2: valid url, reqeust
    //   watchedState.formState = 'requesting';
    //   // console.log('case2 request, watchedState:', watchedState);
    //   const response = await httpRequest(inputValue);

    //   if (isValidRespond(response)) {
    //     // case5: success
    //     watchedState.formState = 'success';
    //     // console.log('resonse data', response.data);
    //     watchedState.listData.push(response.data);

    //     const { feed, posts } = rssParser(response.data);

    //     watchedState.feeds.addFeed(feed);

    //     posts.forEach(({ title, link, description }) =>
    //       watchedState.posts.addPost({
    //         title,
    //         link,
    //         description,
    //         feedId: watchedState.feeds.lastsIndex - 1,
    //       }),
    //     );

    //     return;
    //   }
    //   console.log('checking response: not succeed');
    // }
    // case3: invalid input
    // watchedState.formState = 'invalidInput';
  });
  const modal = document.querySelector('.modal');
  modal.addEventListener('show.bs.modal', (e) => {
    // console.log('modal event');
    const button = e.relatedTarget;
    const buttonId = Number(button.getAttribute('data-id'));
    const modalTitle = document.querySelector('.modal-title');
    const post = _.find(watchedState.posts.data, { id: buttonId });
    // console.log(post);
    modalTitle.innerHTML = post.title;
    const modalBody = document.querySelector('.modal-body');
    modalBody.innerHTML = post.description;
    const fullArticle = document.querySelector('.full-article');
    fullArticle.href = post.link;
  });
};

runApp();
