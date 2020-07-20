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
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import styled, { withTheme } from 'styled-components/native';
import { CachedImage } from 'react-native-cached-image';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { BaseText, MediumText } from 'components/Typography';
import Button from 'components/Button';
import ProfileImage from 'components/ProfileImage';
import { Spacing } from 'components/Layout';
import FeeLabelToggle from 'components/FeeLabelToggle';
import { lineHeights } from 'utils/variables';
import { buildTxFeeInfo } from 'utils/smartWallet';
import { formatAmountDisplay, formatFiat } from 'utils/common';
import { getRate } from 'utils/assets';
import { useGasTokenSelector } from 'selectors/smartWallet';
import { activeAccountAddressSelector } from 'selectors';
import { SEND_TOKEN_PIN_CONFIRM } from 'constants/navigationConstants';
import { defaultFiatCurrency } from 'constants/assetsConstants';
import { getSablierWithdrawTransaction } from 'services/sablier';


const MainContainer = styled.View`
    align-items: center;
    padding: 45px 20px;
`;

const arrowDownGrey = require('assets/icons/arrow_down_grey.png');

const WithdrawReview = ({
  navigation, useGasToken, withdrawTransactionEstimate, baseFiatCurrency, rates, accountAddress,
}) => {
  const { withdrawAmount, stream } = navigation.state.params;
  const txFeeInfo = buildTxFeeInfo(withdrawTransactionEstimate, useGasToken);

  const onNextButtonPress = () => {
    const transactionPayload = getSablierWithdrawTransaction(
      accountAddress,
      stream.id,
      withdrawAmount,
      stream.token,
    );

    if (txFeeInfo.gasToken) transactionPayload.gasToken = txFeeInfo.gasToken;

    navigation.navigate(SEND_TOKEN_PIN_CONFIRM, { transactionPayload });
  };

  const formattedAmount = formatAmountDisplay(withdrawAmount);

  const assetSymbol = stream.token.symbol;

  const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
  const valueInFiat = parseFloat(withdrawAmount) * getRate(rates, assetSymbol, fiatCurrency);
  const formattedFiatAmount = formatFiat(valueInFiat, fiatCurrency);

  return (
    <ContainerWithHeader
      headerProps={{ centerItems: [{ title: 'Review' }] }}
    >
      <MainContainer>
        <ProfileImage
          userName="brandon"
          diameter={64}
          noShadow
          borderWidth={0}
        />
        <Spacing h={8} />
        <BaseText medium>brendon</BaseText>
        <Spacing h={16} />
        <CachedImage
          style={{ width: 17, height: 41 }}
          source={arrowDownGrey}
          resizeMode="contain"
        />
        <Spacing h={24} />
        <MediumText giant>
          {formattedAmount}
          <MediumText big secondary style={{ lineHeight: lineHeights.giant }}> {assetSymbol}</MediumText>
        </MediumText>
        <Spacing h={8} />
        <BaseText small secondary>{formattedFiatAmount}</BaseText>

        <Spacing h={60} />
        <FeeLabelToggle
          labelText="Fee"
          txFeeInWei={txFeeInfo?.fee}
          gasToken={txFeeInfo?.gasToken}
          showFiatDefault
        />
        <Spacing h={16} />
        <Button title="Confirm withdraw" block onPress={onNextButtonPress} />
      </MainContainer>
    </ContainerWithHeader>
  );
};

const mapStateToProps = ({
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency } },
  sablier: { withdrawTransactionEstimate, isCalculatingWithdrawTransactionEstimate },
}: RootReducerState): $Shape<Props> => ({
  rates,
  baseFiatCurrency,
  withdrawTransactionEstimate,
  isCalculatingWithdrawTransactionEstimate,
});

const structuredSelector = createStructuredSelector({
  useGasToken: useGasTokenSelector,
  accountAddress: activeAccountAddressSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

export default connect(combinedMapStateToProps)(WithdrawReview);
