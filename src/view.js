import onChange from 'on-change';

const makeCard = (title) => {
  const card = document.createElement('div');
  card.classList.add('card', 'border-0');

  const cardBody = document.createElement('div');
  cardBody.classList.add('card-body');

  const cardBodyHeader = document.createElement('h2');
  cardBodyHeader.classList.add('card-title', 'h4');
  cardBodyHeader.textContent = `${title}`;

  cardBody.appendChild(cardBodyHeader);
  card.appendChild(cardBody);
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
  const header = document.createElement('h3');
  header.classList.add('h6', 'm-0');
  header.textContent = title;

  const p = document.createElement('p');
  p.classList.add('m-0', 'small', 'text-black-50');
  p.textContent = description;
  li.appendChild(header);
  li.appendChild(p);
  return li;
};

const makePostsLi = (title, link, id, buttonName) => {
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
  a.classList.add('fw-bold');
  a.textContent = `${title}`;

  const button = document.createElement('button');
  button.type = 'button';
  button.classList.add('btn', 'btn-outline-primary', 'btn-sm');
  button.dataset.id = id;
  button.dataset.bsToggle = 'modal';
  button.dataset.bsTarget = '#exampleModal';
  button.textContent = buttonName;

  li.appendChild(a);
  li.appendChild(button);
  return li;
};

const renderFeedBack = (elements, message, state) => {
  const { feedback } = elements;

  switch (state) {
    case 'invalid':
    case 'failed':
      feedback.textContent = message;
      feedback.classList.remove('text-success');
      feedback.classList.add('text-danger');
      return;
    case 'success':
      feedback.textContent = message;
      feedback.classList.add('text-success');
      feedback.classList.remove('text-danger');
      return;
    case 'requesting':
      feedback.textContent = message;
      feedback.classList.remove('text-success');
      feedback.classList.remove('text-danger');
      return;
    default:
      console.error(`Unsupported feedback state: ${state}`);
  }
};

const renderValidationState = (elements, state) => {
  const { input, button } = elements;

  switch (state) {
    case 'invalid':
      input.classList.add('is-invalid');
      input.disabled = false;
      input.removeAttribute('readonly');
      button.disabled = false;
      button.removeAttribute('readonly');
      input.focus();
      return;
    case 'valid':
      input.classList.remove('is-invalid');
      input.disabled = false;
      input.removeAttribute('readonly');
      button.disabled = false;
      button.removeAttribute('readonly');
      input.focus();
      return;
    default:
      console.error(`unknown form state: ${validationState}`);
  };
};

const renderForm = (elements, state) => {
  const { input, button } = elements;
  console.log('render form ran', state);

  switch (state) {
    case 'initial':
      input.classList.remove('is-invalid');
      input.disabled = false;
      input.removeAttribute('readonly');
      button.disabled = false;
      button.removeAttribute('readonly');
      input.value = '';
      input.focus();
      return;
    case 'requesting':
      // input.classList.remove('is-invalid');
      input.disabled = true;
      input.setAttribute('readonly', '');
      button.disabled = true;
      button.setAttribute('readonly', '');
      return;
    case 'failed':
      input.classList.add('is-invalid');
      input.disabled = false;
      input.removeAttribute('readonly');
      button.disabled = false;
      button.removeAttribute('readonly');
      input.focus();
      return;
    case 'success':
      input.classList.remove('is-invalid');
      input.disabled = false;
      input.removeAttribute('readonly');
      button.disabled = false;
      button.removeAttribute('readonly');
      input.value = '';
      input.focus();
      return;
    default:
      console.error(`unknown form state: ${state}`);
  }
};

const renderFeeds = (elements, feeds, feedsTitle) => {
  if (feeds.length === 0) return;
  const { feedsContainer } = elements;
  feedsContainer.textContent = '';
  feedsContainer.appendChild(makeCard(feedsTitle));
  const feedsUl = makeUl();
  feeds.forEach(({
    title, description, link, id,
  }) => {
    feedsUl.appendChild(makeFeedLi(title, description, link, id));
  });
  feedsContainer.appendChild(feedsUl);
};

const tagVisitedPosts = (elements, visitedPostsIds) => {
  const { postsContainer } = elements;
  visitedPostsIds.forEach((id) => {
    const post = postsContainer.querySelector(`[data-id="${id}"]`);
    post.classList.add('fw-nomal', 'link-secondary');
    post.classList.remove('fw-bold');
  });
};

const renderPosts = (elements, posts, postsTexts, visitedPostsIds) => {
  if (posts.length === 0) return;
  const { postsContainer } = elements;
  postsContainer.textContent = '';
  postsContainer.appendChild(makeCard(postsTexts.title));
  const postsUl = makeUl();
  posts
    .sort((a, b) => b.feedId - a.feedIdb)
    .forEach(({ title, link, id }) => {
      postsUl.appendChild(makePostsLi(title, link, id, postsTexts.previewButton));
    });
  postsContainer.appendChild(postsUl);
  tagVisitedPosts(elements, visitedPostsIds);
};

const renderPopup = (elements, postData) => {
  const { modalTitle, modalBody, modalArticleLink } = elements;
  const { title, description, link } = postData;

  modalTitle.textContent = title;
  modalBody.textContent = description;
  modalArticleLink.href = link;
};

const viewHandlers = {
  'form.validationState': (appState, elements) => {
    const {
      form: { validationState },
    } = appState;
    renderValidationState(elements, validationState);
  },

  'form.error': (appState, elements, locales) => {
    const {
      form: { error, validationState },
    } = appState;
    if (!error) return;
    const message = locales(`errors.${error.message}`);
    renderFeedBack(elements, message, validationState);
  },

  'requestingProcess.state': (appState, elements, locales) => {
    console.log('requestingProcess.state run');
    const {
      requestingProcess: { state, error },
    } = appState;
    console.log(state, error);
    const message = error ? locales(`errors.${error.message}`) : locales(`feedback.${state}`);
    console.log(state, error, message);
    renderForm(elements, state);
    renderFeedBack(elements, message, state);
  },

  feeds: (appState, elements, locales) => {
    const {
      feeds,
      form: { validationState },
    } = appState;
    const title = locales('feeds.title');
    renderFeeds(elements, feeds, title);
    // rende`rForm(elements, validationState);
  },

  posts: (appState, elements, locales) => {
    const {
      posts,
      uiState: { visitedPosts },
    } = appState;
    const texts = {
      title: locales('posts.title'),
      previewButton: locales('posts.previewButton'),
    };
    renderPosts(elements, posts, texts, visitedPosts);
  },

  'uiState.visitedPosts': (appState, elements) => {
    const {
      uiState: { visitedPosts },
    } = appState;
    tagVisitedPosts(elements, visitedPosts);
  },

  'uiState.popup.postId': (appState, elements) => {
    const {
      uiState: {
        popup: { postId },
        visitedPosts,
      },
      posts,
    } = appState;
    const postToShow = posts.find((post) => post.id === postId);
    renderPopup(elements, postToShow);
    tagVisitedPosts(elements, visitedPosts);
  },
};

const renderInitialView = (elements, locales) => {
  const {
    title,
    lead,
    inputLabel,
    button,
    sampleUrl,
    modalArticleLink,
    modalCloseButton,
    footerTextContainer,
    hexletLink,
  } = elements;
  title.textContent = locales('title');
  lead.textContent = locales('lead');
  inputLabel.textContent = locales('form.inputLabel');
  button.textContent = locales('form.button');
  sampleUrl.textContent = locales('sampleUrl');

  modalCloseButton.textContent = locales('modal.closeButton');
  modalArticleLink.textContent = locales('modal.readButton');
  footerTextContainer.textContent = locales('footer.text');

  hexletLink.href = 'https://ru.hexlet.io/professions/frontend/projects/11';
  hexletLink.target = '_blank';
  hexletLink.textContent = locales('footer.link');
  footerTextContainer.appendChild(hexletLink);
};

const handleStateChanges = (state, elements, locales) => (path) => {
  if (!viewHandlers[path]) return;
  viewHandlers[path](state, elements, locales);
};

const render = (state, locales, elements) => {
  renderInitialView(elements, locales);

  return onChange(state, handleStateChanges(state, elements, locales));
};

export default render;
