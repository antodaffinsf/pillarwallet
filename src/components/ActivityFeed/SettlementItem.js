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
import * as React from 'react';
import styled from 'styled-components/native';
import isEmpty from 'lodash.isempty';

import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import { BaseText } from 'components/Typography';
import TankAssetBalance from 'components/TankAssetBalance';
import { baseColors, fontSizes, spacing } from 'utils/variables';
import { SYNTHETIC, NONSYNTHETIC } from 'constants/assetsConstants';
import { getAssetData } from 'utils/assets';
import { formatAmount, formatUnits } from 'utils/common';
import type { Asset } from 'models/Asset';

const ppnIcon = require('assets/icons/icon_PPN.png');

type SettlementItemType = {
  hash: string,
  symbol: string,
  value: string | number,
}

type Props = {
  settleData: SettlementItemType[],
  type?: string,
  asset?: string,
  onPress: Function,
  isPending?: boolean,
  accountAssets: Asset[],
  supportedAssets: Asset[],
}

const ListWrapper = styled.View`
  align-items: flex-end;
  padding-left: ${spacing.mediumLarge}px;
`;

const ItemValue = styled(BaseText)`
  font-size: ${fontSizes.big}px;
  color: ${baseColors.jadeGreen};
  text-align: right;
`;

export const SettlementItem = (props: Props) => {
  const {
    settleData,
    type,
    asset,
    onPress,
    isPending,
    accountAssets,
    supportedAssets,
  } = props;
  const ppnTransactions = asset
    ? settleData.filter(({ symbol }) => symbol === asset)
    : settleData;

  const valueByAsset: Object = {};
  const formattedPPNTransactions = ppnTransactions.map((trx) => {
    const { symbol, value: rawValue } = trx;
    const { decimals = 18 } = getAssetData(accountAssets, supportedAssets, symbol);
    const value = +formatAmount(formatUnits(rawValue.toString(), decimals));
    if (!valueByAsset[symbol]) {
      valueByAsset[symbol] = { ...trx, value };
    } else {
      valueByAsset[symbol].value += value;
    }
    return { ...trx, value };
  });

  const valuesArray = Object.keys(valueByAsset).map((key) => valueByAsset[key]);

  const itemStatusIcon = (isPending && 'pending') || '';
  const rightColumnInnerStyle = (isPending && { flexDirection: 'row', alignItems: 'center' }) || {};
  const customAddonAlignLeft = !isEmpty(rightColumnInnerStyle);

  return (
    <React.Fragment>
      {(!type || type === NONSYNTHETIC) &&
        <ListItemWithImage
          onPress={onPress}
          label="Deposit"
          itemImageSource={ppnIcon}
          subtext="to Smart Wallet"
          customAddon={(
            <ListWrapper>
              {valuesArray.map(({ symbol, value }) => <ItemValue key={symbol}>{`${value} ${symbol}`}</ItemValue>)}
            </ListWrapper>)}
          innerWrapperHorizontalAlign="flex-start"
          itemStatusIcon={itemStatusIcon}
          customAddonAlignLeft={customAddonAlignLeft}
          rightColumnInnerStyle={rightColumnInnerStyle}
          diameter={56}
        />
      }
      {(!type || type === SYNTHETIC) &&
        <ListItemWithImage
          onPress={onPress}
          label="Withdrawal"
          itemImageSource={ppnIcon}
          subtext="from PLR Network"
          customAddon={(
            <ListWrapper>
              {formattedPPNTransactions.map(({ symbol, value, hash }) => (
                <TankAssetBalance
                  key={hash}
                  amount={`- ${value} ${symbol}`}
                  monoColor
                  textStyle={{ color: baseColors.scarlet }}
                />
              ))}
            </ListWrapper>)}
          innerWrapperHorizontalAlign="flex-start"
          itemStatusIcon={itemStatusIcon}
          customAddonAlignLeft={customAddonAlignLeft}
          rightColumnInnerStyle={rightColumnInnerStyle}
          diameter={56}
        />
      }
    </React.Fragment>
  );
};
