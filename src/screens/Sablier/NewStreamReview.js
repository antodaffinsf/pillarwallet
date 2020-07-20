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
import { utils, BigNumber as EthersBigNumber } from 'ethers';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import styled from 'styled-components/native';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Button from 'components/Button';
import { Spacing } from 'components/Layout';
import FeeLabelToggle from 'components/FeeLabelToggle';
import { SEND_TOKEN_PIN_CONFIRM } from 'constants/navigationConstants';
import { defaultFiatCurrency } from 'constants/assetsConstants';
import { SABLIER_CREATE_STREAM } from 'constants/sablierConstants';
import { getCreateStreamTransaction } from 'services/sablier';
import {
  countDownDHMS,
  formatFiat,
} from 'utils/common';
import { getRate, getAssetData, getAssetsAsList } from 'utils/assets';
import { activeAccountAddressSelector } from 'selectors';
import { accountAssetsSelector } from 'selectors/assets';
import NewStreamReviewScheme from './NewStreamReviewScheme';


const RootContainer = styled.View`
  padding: 45px 0;
  align-items: center;
`;

const ButtonWrapper = styled.View`
  padding: 0 20px;
  align-self: stretch; 
`;

class NewStreamReview extends React.Component {
  onSubmit = async () => {
    const {
      navigation, activeAccountAddress, assets, supportedAssets,
    } = this.props;
    const {
      startDate, endDate, receiverAddress, assetValue, assetSymbol,
    } = navigation.state.params;

    const assetData = getAssetData(getAssetsAsList(assets), supportedAssets, assetSymbol);

    const createStreamTransaction = await getCreateStreamTransaction(
      activeAccountAddress,
      receiverAddress,
      assetValue,
      assetData.address,
      Math.round(startDate.getTime() / 1000),
      Math.round(endDate.getTime() / 1000),
    );

    navigation.navigate(SEND_TOKEN_PIN_CONFIRM, {
      transactionPayload: createStreamTransaction,
      goBackDismiss: true,
      transactionType: SABLIER_CREATE_STREAM,
    });
  }

  render() {
    const { baseFiatCurrency, rates, navigation } = this.props;
    const {
      assetSymbol, assetValue, receiverAddress, startDate, endDate,
    } = navigation.state.params;
    const { days, hours, minutes } = countDownDHMS(endDate.getTime() - startDate.getTime());

    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    const rate = getRate(rates, assetSymbol, fiatCurrency);
    const assetValueFiat = formatFiat(utils.formatUnits(assetValue, 18) * rate, fiatCurrency);

    const txFeeInfo = {};

    return (
      <ContainerWithHeader
        inset={{ bottom: 'never' }}
        headerProps={{ centerItems: [{ title: 'Review' }] }}
        putContentInScrollView
      >
        <RootContainer>
          <NewStreamReviewScheme
            assetValue={utils.formatUnits(assetValue, 18)}
            assetValueFiat={assetValueFiat}
            assetSymbol={assetSymbol}
            time={`${days}d ${hours}h ${minutes}m`}
            receiver={receiverAddress}
          />
          <Spacing h={70} />
          <FeeLabelToggle
            labelText="Fee"
            txFeeInWei={txFeeInfo?.fee}
            gasToken={txFeeInfo?.gasToken}
            showFiatDefault
          />
          <Spacing h={16} />
          <ButtonWrapper>
            <Button
              title="Start stream"
              onPress={this.onSubmit}
            />
          </ButtonWrapper>
        </RootContainer>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency } },
  assets: { supportedAssets },
}: RootReducerState): $Shape<Props> => ({
  rates,
  baseFiatCurrency,
  supportedAssets,
});

const structuredSelector = createStructuredSelector({
  activeAccountAddress: activeAccountAddressSelector,
  assets: accountAssetsSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

export default connect(combinedMapStateToProps)(NewStreamReview);
