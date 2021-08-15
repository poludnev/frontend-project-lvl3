const initialHandler = (locales) => {
  // console.log('initial state view handler');
  document.querySelector('h1').innerHTML = locales('title');
  document.querySelector('.lead').innerHTML = locales('lead');
  document.querySelector('#url-input ~ label').innerHTML = locales('form.inputLabel');
  document.querySelector('form button').innerHTML = locales('form.button');
  document.querySelector('form ~ p').innerHTML = locales('sampleUrl');
  const footerLink = document.querySelector('footer a');
  footerLink.innerHTML = locales('footer.link');
  const footerText = footerLink.parentElement;
  footerText.childNodes[0].nodeValue = locales('footer.text');
};

const invalidHandler = (state) => {
  const input = document.querySelector('input');
  input.classList.add('is-invalid');
  input.removeAttribute('readonly');
  input.disabled = false;

  const button = document.querySelector('[name="add"]');
  button.disabled = false;
  button.removeAttribute('readonly');

  const feedback = document.querySelector('.feedback');
  feedback.innerHTML = `${state.feedbackMessage}`;
  feedback.classList.remove('text-success');
  feedback.classList.add('text-danger');
};

const validHandler = (state) => {
  const input = document.querySelector('input');
  input.removeAttribute('readonly');
  input.classList.remove('is-invalid');
  input.disabled = false;
  input.value = '';

  const button = document.querySelector('[name="add"]');
  button.disabled = false;
  button.removeAttribute('readonly');

  const feedback = document.querySelector('.feedback');
  feedback.innerHTML = `${state.feedbackMessage}`;
  feedback.classList.add('text-success');
  feedback.classList.remove('text-danger');
};

const requestingHandler = () => {
  const input = document.querySelector('input');
  input.classList.remove('is-invalid');
  input.disabled = true;
  input.setAttribute('readonly', '');

  const button = document.querySelector('[name="add"]');
  button.setAttribute('readonly', '');
  button.disabled = true;

  const feedback = document.querySelector('.feedback');
  feedback.innerHTML = '';
};

const makeCard = (title) => {
  const card = document.createElement('div');
  card.classList.add('card', 'border-0');
  card.innerHTML = `<div class="card-body"><h2 class="card-title h4">${title}</h2></div>`;
  return card;
};

const makeUl = () => {
  const ul = document.createElement('ul');
  ul.classList.add('list-group', 'border-0', 'rounded-0');
  return ul;
};

const makeFeedLi = (title, description) => {
  const li = document.createElement('li');
  li.classList.add('list-group-item', 'border-0', 'border-end-0');
  const h3 = document.createElement('h3');
  h3.classList.add('h6', 'm-0');
  h3.innerHTML = title;

  const p = document.createElement('p');
  p.classList.add('m-0', 'small', 'text-black-50');
  p.innerHTML = description;
  li.appendChild(h3);
  li.appendChild(p);
  return li;
};

const renderFeeds = (state) => {
  const feeds = document.querySelector('.feeds');
  feeds.innerHTML = '';
  if (state.data.length === 0) return;
  feeds.appendChild(makeCard(state.title));
  const feedsUl = makeUl();
  const feedsData = state.data;

  feedsData
    .sort((a, b) => b.id - a.id)
    .forEach(({ title, description, link, id }) => {
      feedsUl.appendChild(makeFeedLi(title, description, link, id));
    });
  feeds.appendChild(feedsUl);
};

const makePostsLi = (title, link, id, visited, buttonName) => {
  const li = document.createElement('li');
  li.classList.add(
    'list-group-item',
    'd-flex',
    'justify-content-between',
    'align-items-start',
    'border-0',
    'border-end-0',
  );
  const a = document.createElement('a');
  a.href = `${link}`;
  a.dataset.id = id;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  if (visited) {
    a.classList.add('fw-nomal', 'link-secondary');
  } else {
    a.classList.add('fw-bold');
  }

  a.innerHTML = `${title}`;
  const button = document.createElement('button');
  button.type = 'button';
  button.classList.add('btn', 'btn-outline-primary', 'btn-sm');
  button.dataset.id = id;
  button.dataset.bsToggle = 'modal';
  button.dataset.bsTarget = '#exampleModal';
  button.innerHTML = buttonName;

  li.appendChild(a);
  li.appendChild(button);
  return li;
};

const renderPosts = (state) => {
  const posts = document.querySelector('.posts');
  posts.innerHTML = '';
  if (state.data.length === 0) return;
  posts.appendChild(makeCard(state.title));
  const postsUl = makeUl();
  const postsData = state.data;
  postsData
    .sort((a, b) => b.feedId - a.feedId)
    .forEach(({ title, link, id, visited }) => {
      postsUl.appendChild(makePostsLi(title, link, id, visited, state.buttonsName));
    });
  posts.appendChild(postsUl);
};

const viewHandlers = {
  initial(state) {
    initialHandler(state);
  },
  requesting() {
    requestingHandler();
  },
  success(state) {
    validHandler(state);
  },
  urlExists(state) {
    invalidHandler(state);
  },
  invalidURL(state) {
    invalidHandler(state);
  },
  invalidRSS(state) {
    invalidHandler(state);
  },
  networkError(state) {
    invalidHandler(state);
  },
  feeds(state) {
    renderFeeds(state);
  },
  posts(state) {
    renderPosts(state);
  },
};

export default viewHandlers;
