import { render } from "@testing-library/react";
import { applyMiddleware, combineReducers, createStore } from "redux";
import thunk from "redux-thunk";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { cartReducer } from "../../src/redux/reducers/cartReducers";
import {
  getProductDetailsReducer,
  getProductsReducer,
} from "../../src/redux/reducers/productReducers";
import { userReducer } from "../../src/redux/reducers/userReducer";

const rootReducer = combineReducers({
  cart: cartReducer,
  getProducts: getProductsReducer,
  getProductDetails: getProductDetailsReducer,
  user: userReducer,
});

export const makeTestStore = (preloadedState = {}) =>
  createStore(rootReducer, preloadedState, applyMiddleware(thunk));

export const renderWithProviders = (
  ui,
  { preloadedState = {}, store = makeTestStore(preloadedState), route = "/" } = {},
) => ({
  store,
  ...render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </Provider>,
  ),
});
