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

import { utils, BigNumber as EthersBigNumber } from 'ethers';

export const getStreamBalance = (stream: SablierStream): EthersBigNumber => {
  const {
    startTime, stopTime, deposit, withdrawals,
  } = stream;
  const now = Math.round(new Date().getTime() / 1000);

  if (now < startTime) return 0;

  const streamDuration = stopTime - startTime;
  const streamProgress = Math.min(1, (now - startTime) / streamDuration);

  const totalWithdrawn = withdrawals?.reduce(
    (withdrawn, withdrawal) => EthersBigNumber.from(withdrawal.amount).add(withdrawn),
     0,
    ) || 0;

  return EthersBigNumber.from(deposit).mul(streamProgress).sub(totalWithdrawn);
};
