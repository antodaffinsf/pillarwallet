// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/
import isEmpty from 'lodash.isempty';
import get from 'lodash.get';
import FS from 'react-native-fs';
import Textile, {
  IAddThreadConfig,
  Thread,
  AddThreadConfig,
  ThreadList,
  IThread,
  IFilesList,
} from '@textile/react-native-sdk';
import { TEXTILE_MNEMONIC } from 'react-native-dotenv';

import type { Dispatch, GetState } from 'reducers/rootReducer';
import type { ThreadMeta, UIWalletSettings } from 'models/Textile';
import {
  SET_TEXTILE_INITIALIZED,
  SET_TEXTILE_VERSION,
  SET_TEXTILE_NODE_STARTED,
  UPDATE_TEXTILE_THREADS,
  ADD_TEXTILE_THREAD,
  SET_TEXTILE_WALLET_SETTINGS,
} from 'constants/textileConstants';
import { walletSettingsThreadMeta } from 'configs/textileConfig';

export const initTextileAction = () => {
  return async (dispatch: Dispatch) => {
    if (!TEXTILE_MNEMONIC) throw new Error('Textile mnemonic is not set');

    const textileRepoPath = `${FS.DocumentDirectoryPath}/textile-go`;
    const recoveryPhrase = TEXTILE_MNEMONIC;
    const textileWallet = await Textile.walletAccountAt(recoveryPhrase, 0);

    const initialized = await Textile.isInitialized(textileRepoPath);
    if (!initialized) {
      await Textile.initialize(textileRepoPath, textileWallet.seed, true, false);
    }

    await Textile.launch(textileRepoPath, true);
    dispatch({ type: SET_TEXTILE_INITIALIZED });

    const version = await Textile.version();
    dispatch({ type: SET_TEXTILE_VERSION, payload: version });
  };
};

export const loadAllThreadsAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { textile: { initialized } } = getState();
    if (!initialized) throw new Error('Textile is not initialized');

    const threads: ThreadList = await Textile.threads.list();
    if (!isEmpty(get(threads, 'items'))) {
      dispatch({ type: UPDATE_TEXTILE_THREADS, payload: threads.items });
    }
  };
};

export const findOrCreateThreadAction = (threadMeta: ThreadMeta) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { threads } = getState().textile;
    const threadExists = threads.find((thread: IThread) => thread.key === threadMeta.key);
    if (threadExists) return;

    const schema = {
      id: '',
      json: JSON.stringify(threadMeta.schema),
      preset: AddThreadConfig.Schema.Preset.NONE,
    };
    const config: IAddThreadConfig = {
      key: threadMeta.key,
      name: threadMeta.key,
      type: Thread.Type.PRIVATE,
      sharing: Thread.Sharing.NOT_SHARED,
      schema,
      force: false,
      whitelist: [],
    };

    const newThread = await Textile.threads.add(config);
    dispatch({
      type: ADD_TEXTILE_THREAD,
      payload: newThread,
    });
  };
};

export const loadOrCreateThreadsAction = () => {
  return async (dispatch: Dispatch) => {
    try {
      await dispatch(loadAllThreadsAction());
      await dispatch(findOrCreateThreadAction(walletSettingsThreadMeta));
    } catch (e) {
      console.log('Error loading textile threads', e);
    }
  };
};

export const refreshWalletSettingsAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { threads } = getState().textile;
    // TODO: use selector
    const walletSettingsThread = threads.find((thread: IThread) => thread.key === walletSettingsThreadMeta.key);
    if (!walletSettingsThread) return;

    const walletSettings: UIWalletSettings[] = [];
    try {
      const files: IFilesList = await Textile.files.list(walletSettingsThread.id, '', -1);
      console.log({ files });

      const promises = files.items.map(async file => {
        const { block } = file;
        const hashes = file.files.map((ffs) => ffs.file.hash);

        await Promise.all(hashes.map(async hash => {
          const content = await Textile.files.content(hash);
          // const json = Buffer.from(data.split(',')[1], 'base64').toString()
          const json = Buffer.from(content.data, 'base64').toString();
          const data = JSON.parse(json);
          walletSettings.push({
            block,
            stored: data,
          });
        }));
      });
      await Promise.all(promises);
      console.log({ walletSettings });
    } catch (err) {
      console.error(err);
    } finally {
      dispatch({
        type: SET_TEXTILE_WALLET_SETTINGS,
        payload: walletSettings,
      });
    }
  };
};

export const onNodeStartedAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { textile: { initialized } } = getState();
    if (!initialized) throw new Error('Textile is not initialized');

    dispatch({ type: SET_TEXTILE_NODE_STARTED });
    await dispatch(loadOrCreateThreadsAction());
    await dispatch(refreshWalletSettingsAction());
    /*
    // yield put(MainActions.uploadAllNotes()) -> updates the state
    +yield call(refreshNotes)
    uploadAllNotes()
     */
  };
};