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

export default {
  // $FlowFixMe
  0: (state) => { // 0 is the redux persist version to migrate to
    return {
      ...state,
      poolTogether: {
        ...state.poolTogether, // all the state keys of the reducer should be spread to the active storage
        lastSynced: { // the newly added keys to the reducer with initial values
          DAI: 0,
          USDC: 0,
          withdrawalsDeposits: 0,
        },
      },
    };
  },
  // $FlowFixMe
  1: (state) => { // 1 is the redux persist version to migrate to
    return {
      ...state,
      poolTogether: {
        ...state.poolTogether, // all the state keys of the reducer should be spread to the active storage
        lastSynced: { // the newly added keys to the reducer with initial values
          ...state.poolTogether.lastSynced,
          withdrawalsDeposits: undefined,
        },
      },
    };
  },
};
