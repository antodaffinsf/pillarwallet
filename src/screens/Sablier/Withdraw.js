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

import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import debounce from 'lodash.debounce';
import styled, { withTheme } from 'styled-components/native';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { ValueSelectorCard } from 'components/ValueSelectorCard';
import { BaseText } from 'components/Typography';
import Button from 'components/Button';
import { Spacing } from 'components/Layout';
import FeeLabelToggle from 'components/FeeLabelToggle';

// constants
import { SABLIER_WITHDRAW_REVIEW } from 'constants/navigationConstants';

// utils
import { getAssetData, getAssetsAsList } from 'utils/assets';
import { formatUnits } from 'utils/common';
import { buildTxFeeInfo } from 'utils/smartWallet';
import { getStreamBalance } from 'utils/sablier';

// selectors
import { accountAssetsSelector } from 'selectors/assets';
import { useGasTokenSelector } from 'selectors/smartWallet';

// actions
import { calculateSablierWithdrawTransactionEstimateAction } from 'actions/sablierActions';


const FooterWrapper = styled.View`
  padding: 16px 20px;
  align-items: center;
  width: 100%;
`;

const Withdraw = (props) => {
  const [withdrawAmount, setWithdrawAmount] = useState(0);

  useEffect(() => {
    const { calculateSablierWithdrawTransactionEstimate, navigation } = props;
    const { stream: { id: streamId, token } } = navigation.state.params;
    calculateSablierWithdrawTransactionEstimate(streamId, withdrawAmount, token);
  }, [withdrawAmount]);

  const goToReviewScreen = () => {
    const { navigation } = props;
    const stream = navigation.getParam('stream');

    navigation.navigate(SABLIER_WITHDRAW_REVIEW, {
      withdrawAmount,
      stream,
    });
  };

  const onValueChanged = (value: Object) => {
    if (!value) {
      setWithdrawAmount(0);
      return;
    }
    setWithdrawAmount(value?.input);
  };

  const {
    assets, supportedAssets, navigation, baseFiatCurrency,
    rates, withdrawTransactionEstimate, isCalculatingWithdrawTransactionEstimate, useGasToken,
  } = props;
  const stream = navigation.getParam('stream');
  const assetSymbol = stream.token.symbol;

  const assetOptions = [getAssetData(getAssetsAsList(assets), supportedAssets, assetSymbol)];

  const streamBalance = getStreamBalance(stream);
  const streamedAssetBalance: Balances = {
    [assetSymbol]: { symbol: assetSymbol, balance: formatUnits(streamBalance, stream.token.decimals) },
  };

  const txFeeInfo = buildTxFeeInfo(withdrawTransactionEstimate, useGasToken);

  const isNextButtonDisabled = isCalculatingWithdrawTransactionEstimate;
  const nextButtonTitle = isCalculatingWithdrawTransactionEstimate ? 'Getting fee..' : 'Next';

  return (
    <ContainerWithHeader
      headerProps={{ centerItems: [{ title: 'Withdraw' }] }}
      footer={
        <FooterWrapper>
          <FeeLabelToggle
            labelText="Fee"
            txFeeInWei={txFeeInfo?.fee}
            gasToken={txFeeInfo?.gasToken}
            isLoading={isCalculatingWithdrawTransactionEstimate}
            showFiatDefault
          />
          <Spacing h={16} />
          <Button
            disabled={isNextButtonDisabled}
            title={nextButtonTitle}
            onPress={goToReviewScreen}
            block
          />
        </FooterWrapper>
      }
    >
      <ValueSelectorCard
        preselectedAsset={assetSymbol}
        customOptions={assetOptions}
        balances={streamedAssetBalance}
        baseFiatCurrency={baseFiatCurrency}
        rates={rates}
        maxLabel="Max"
        getFormValue={onValueChanged}
      />
      <BaseText regular secondary center>You will receive {assetSymbol} in your wallet.</BaseText>

    </ContainerWithHeader>
  );
};

const mapStateToProps = ({
  assets: { supportedAssets },
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency } },
  sablier: { withdrawTransactionEstimate, isCalculatingWithdrawTransactionEstimate },
}: RootReducerState): $Shape<Props> => ({
  supportedAssets,
  rates,
  baseFiatCurrency,
  withdrawTransactionEstimate,
  isCalculatingWithdrawTransactionEstimate,
});

const structuredSelector = createStructuredSelector({
  assets: accountAssetsSelector,
  useGasToken: useGasTokenSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  calculateSablierWithdrawTransactionEstimate: debounce((streamId: number, amount: number, asset: SablierAsset) =>
    dispatch(calculateSablierWithdrawTransactionEstimateAction(streamId, amount, asset)), 500),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(Withdraw);
