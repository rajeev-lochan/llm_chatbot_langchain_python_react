import { configureStore } from "@reduxjs/toolkit";
import chatReducer from "./features/chatSlice";

import { persistStore, persistReducer } from "redux-persist";

import { combineReducers } from "redux";
import storage from "./utils/storage";


const persistConfig = {
  key: "root",
  storage,
  whitelist: ["messages"], // only persist chat history
};

const rootReducer = combineReducers({
  chat: persistReducer(persistConfig, chatReducer),
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
