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
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Button from 'components/Button';
import { getCancellationFeeAndTransaction } from 'services/sablier';
import { SEND_TOKEN_PIN_CONFIRM } from 'constants/navigationConstants';
import { accountBalancesSelector } from 'selectors/balances';
import { useGasTokenSelector } from 'selectors/smartWallet';
import { isEnoughBalanceForTransactionFee } from 'utils/assets';

import SablierCancellationModal from './SablierCancellationModal';


class OutgoingStream extends React.Component {
  state = {
    isCancellationModalVisible: false,
    isFetchingCancellationFee: false,
  }

  onCancel = async () => {
    this.setState({ isFetchingCancellationFee: true });

    const { useGasToken, navigation } = this.props;
    const { stream: { id: streamId } } = navigation.state.params;

    const {
      txFeeInWei,
      gasToken,
      transactionPayload,
    } = await getCancellationFeeAndTransaction(streamId, useGasToken);

    this.setState({
      isFetchingCancellationFee: false,
      isCancellationModalVisible: true,
      gasToken,
      cancellationPayload: transactionPayload,
      txFeeInWei,
    });
  }

  onCancelConfirm = () => {
    const { navigation } = this.props;
    const { cancellationPayload } = this.state;
    this.setState({ isCancellationModalVisible: false });

    navigation.navigate(SEND_TOKEN_PIN_CONFIRM, {
      transactionPayload: cancellationPayload,
    });
  }

  render() {
    const { balances } = this.props;
    const {
      isCancellationModalVisible,
      isFetchingCancellationFee,
      cancellationPayload,
      txFeeInWei,
      gasToken,
    } = this.state;

    let cancelData = {};
    if (cancellationPayload) {
      const isDisabled = !isEnoughBalanceForTransactionFee(balances, cancellationPayload);

      cancelData = {
        txFeeInWei,
        isDisabled,
        gasToken,
      };
    }

    return (
      <ContainerWithHeader
        inset={{ bottom: 'never' }}
        headerProps={{ centerItems: [{ title: 'Outgoing stream' }] }}
      >
        <Button title="Cancel stream" onPress={this.onCancel} isLoading={isFetchingCancellationFee} />
        <SablierCancellationModal
          isVisible={isCancellationModalVisible}
          cancelData={cancelData}
          onModalHide={() => this.setState({ isCancellationModalVisible: false })}
          onCancel={this.onCancelConfirm}
        />
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
  balances: accountBalancesSelector,
  useGasToken: useGasTokenSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});


export default connect(combinedMapStateToProps)(OutgoingStream);
