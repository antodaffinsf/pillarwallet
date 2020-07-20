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
import { addHours, addDays, addMinutes } from 'date-fns';
import DatePicker from 'react-native-date-picker';
import { utils, BigNumber as EthersBigNumber } from 'ethers';

import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import ValueSelectorCard from 'components/ValueSelectorCard';
import TimingInput from 'components/TimingInput';
import { MediumText, TextLink, BaseText } from 'components/Typography';
import { Spacing } from 'components/Layout';
import Button from 'components/Button';
import Selector from 'components/Selector';
import SlideModal from 'components/Modals/SlideModal';

import { getThemeColors } from 'utils/themes';
import { countDownDHMS } from 'utils/common';
import { getAssetData, getAssetsAsList, isEnoughBalanceForTransactionFee } from 'utils/assets';

import { DAI } from 'constants/assetsConstants';
import { SABLIER_NEW_STREAM_REVIEW, SEND_TOKEN_PIN_CONFIRM } from 'constants/navigationConstants';
import { SABLIER_ALLOW } from 'constants/sablierConstants';

import { checkSablierAllowance, getApproveFeeAndTransaction } from 'services/sablier';

import { activeAccountAddressSelector } from 'selectors';
import { accountAssetsSelector } from 'selectors/assets';
import { accountBalancesSelector } from 'selectors/balances';
import { useGasTokenSelector } from 'selectors/smartWallet';

import SablierAllowanceModal from './SablierAllowanceModal';


const Row = styled.View`
  flex-direction: row;
  justify-content: space-between;
`;

const ContentWrapper = styled.View`
  padding: 0 20px;
`;

const PickerWrapper = styled.View`
  padding: 18px 20px;
`;

const START_TIME = 'START_TIME';
const END_TIME = 'END_TIME';

class NewStream extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      startDate: this.getMinimalDate(),
      endDate: null,
      modalDate: null,
      activeDatePicker: null,
      assetValue: 0,
      assetSymbol: null,
      selectedContact: null,
      isAllowanceModalVisible: false,
      txFeeInWei: 0,
    };
  }


  getMinimalDate = () => {
    return addMinutes(new Date(), 5);
  }

  getFormValue = (value) => {
    const { input = '0' } = value || {};
    const newValue = Math.floor(parseFloat(input));
    this.setState({
      assetValue: newValue,
      assetSymbol: value?.selector?.symbol,
    });
  }

  handleReceiverSelect = (value: Option, onSuccess?: () => void) => {
    this.setState({ selectedContact: value });
    if (onSuccess) onSuccess();
  }

  onSubmit = async () => {
    const {
      assets, supportedAssets, activeAccountAddress, useGasToken,
    } = this.props;
    const {
      startDate, endDate, assetValue, assetSymbol, selectedContact: { ethAddress },
    } = this.state;
    this.setState({ isCheckingAllowance: true });

    const assetData = getAssetData(getAssetsAsList(assets), supportedAssets, assetSymbol);

    // The deposit must be a multiple of the difference between the stop time and the start time,
    // or otherwise the contract reverts with a "deposit not multiple of time delta" message.
    const timeDelta = Math.round((endDate.getTime() - startDate.getTime()) / 1000);
    const assetValueInWei = utils.parseUnits(assetValue.toString(), assetData.decimals);
    const roundedAssetValue = assetValueInWei.sub(assetValueInWei.mod(timeDelta));

    const allowance = await checkSablierAllowance(assetData.address, activeAccountAddress);

    if (allowance?.lt(roundedAssetValue)) {
      const {
        txFeeInWei,
        gasToken,
        transactionPayload,
      } = await getApproveFeeAndTransaction(assetData, useGasToken);
      this.setState({
        isAllowanceModalVisible: true,
        gasToken,
        allowPayload: transactionPayload,
        txFeeInWei,
      });
    } else {
      this.props.navigation.navigate(SABLIER_NEW_STREAM_REVIEW, {
        startDate,
        endDate,
        assetValue: roundedAssetValue,
        assetSymbol,
        receiverAddress: ethAddress,
      });
    }
    this.setState({ isCheckingAllowance: false });
  }

  openDatePicker = (picker: string, date: Date) => {
    this.setState({ activeDatePicker: picker, modalDate: date });
  }

  closePicker = () => {
    this.setState({ activeDatePicker: null });
  }

  handleDateModalConfirm = () => {
    const { activeDatePicker, modalDate } = this.state;
    const newState = {
      activeDatePicker: null,
    };
    if (activeDatePicker === START_TIME) {
      newState.startDate = modalDate;
    } else {
      newState.endDate = modalDate;
    }
    this.setState(newState);
  }

  renderDatePicker = (picker: string) => {
    const { activeDatePicker, modalDate, startDate } = this.state;
    const colors = getThemeColors(this.props.theme);

    const header = picker === START_TIME ? (
      <Row>
        <MediumText labelTertiary regular>Start</MediumText>
        <TextLink onPress={() => this.setState({ modalDate: this.getMinimalDate() })}>Start immediately</TextLink>
      </Row>
    ) : (
      <Row>
        <MediumText labelTertiary regular>End</MediumText>
        <Row>
          <TextLink onPress={() => this.setState({ modalDate: addHours(modalDate, 1) })}>+1 hour</TextLink>
          <Spacing w={10} />
          <TextLink onPress={() => this.setState({ modalDate: addDays(modalDate, 1) })}>+1 day</TextLink>
          <Spacing w={10} />
          <TextLink onPress={() => this.setState({ modalDate: addDays(modalDate, 30) })}>+30 days</TextLink>
        </Row>
      </Row>
    );

    const minimumDate = picker === START_TIME ? this.getMinimalDate() : startDate;

    return (
      <SlideModal
        isVisible={activeDatePicker === picker}
        onModalHide={this.closePicker}
        hideHeader
        noPadding
      >
        <PickerWrapper>
          {header}
          <Spacing h={8} />
          <TimingInput value={modalDate} />
          <Spacing h={20} />
          <DatePicker
            date={modalDate || this.getMinimalDate()}
            onDateChange={(date) => this.setState({ modalDate: date })}
            androidVariant="nativeAndroid"
            mode="datetime"
            textColor={colors.text}
            minimumDate={minimumDate}
          />
          <Spacing h={20} />
          <Button
            title="Next"
            onPress={this.handleDateModalConfirm}
          />
        </PickerWrapper>
      </SlideModal>
    );
  }

  isFormValid = () => {
    const { assetValue, startDate, endDate } = this.state;
    return assetValue && startDate && endDate;
  }

  renderStreamSummary = () => {
    const {
      assetValue, assetSymbol, startDate, endDate,
    } = this.state;
    if (!this.isFormValid()) {
      return null;
    }

    const timeDelta = endDate.getTime() - startDate.getTime();
    const streamingRate = ((assetValue / timeDelta) * 1000 * 60).toFixed(5);
    const { days, hours } = countDownDHMS(timeDelta);
    let duration = '';
    if (days === 0) {
      if (hours === 1) {
        duration = '1 hour';
      } else {
        duration = `${hours} hours`;
      }
    } else if (days === 1) {
      duration = '1 day';
    } else {
      duration = `${days} days`;
    }

    return (
      <BaseText regular secondary>
        You will stream a total of {assetValue} {assetSymbol} for {duration} at a rate of {streamingRate} per minute
      </BaseText>
    );
  }

  hideAllowanceModal = () => {
    this.setState({ isAllowanceModalVisible: false });
  }

  onAllowConfirm = () => {
    const { navigation } = this.props;
    const { allowPayload } = this.state;
    this.hideAllowanceModal();
    navigation.navigate(SEND_TOKEN_PIN_CONFIRM, {
      transactionPayload: allowPayload,
      goBackDismiss: true,
      transactionType: SABLIER_ALLOW,
    });
  }

  render() {
    const { balances } = this.props;
    const {
      startDate,
      endDate,
      selectedContact,
      isAllowanceModalVisible,
      assetSymbol,
      isCheckingAllowance,
      gasToken,
      txFeeInWei,
      allowPayload,
    } = this.state;

    const formValid = this.isFormValid();

    let allowData = {};
    if (allowPayload) {
      const isDisabled = !isEnoughBalanceForTransactionFee(balances, allowPayload);

      allowData = {
        assetSymbol,
        txFeeInWei,
        isDisabled,
        gasToken,
      };
    }


    return (
      <ContainerWithHeader
        inset={{ bottom: 'never' }}
        headerProps={{ centerItems: [{ title: 'New stream' }] }}
        putContentInScrollView
      >
        <Selector
          label="To"
          placeholder="Choose receiver"
          searchPlaceholder="Wallet address"
          noOptionImageFallback
          hasQRScanner
          disableSelfSelect
          allowEnteringCustomAddress
          onOptionSelect={this.handleReceiverSelect}
          options={[]}
          selectedOption={selectedContact}
        />

        <ValueSelectorCard
          preselectedAsset={DAI}
          maxLabel="Send max"
          getFormValue={this.getFormValue}
        />

        <Spacing h={34} />
        <ContentWrapper>
          <Row>
            <MediumText regular>Start</MediumText>
            <TextLink onPress={() => this.setState({ startDate: this.getMinimalDate() })}>Start immediately</TextLink>
          </Row>
          <Spacing h={8} />
          <TimingInput filled value={startDate} onPress={() => this.openDatePicker(START_TIME, startDate)} />

          <Spacing h={38} />

          <Row>
            <MediumText regular>End</MediumText>
            <Row>
              <TextLink onPress={() => this.setState({ endDate: addHours(endDate, 1) })}>+1 hour</TextLink>
              <Spacing w={10} />
              <TextLink onPress={() => this.setState({ endDate: addDays(endDate, 1) })}>+1 day</TextLink>
              <Spacing w={10} />
              <TextLink onPress={() => this.setState({ endDate: addDays(endDate, 30) })}>+30 days</TextLink>
            </Row>
          </Row>
          <Spacing h={8} />
          <TimingInput filled value={endDate} onPress={() => this.openDatePicker(END_TIME, endDate)} />

          <Spacing h={64} />
          <Button
            title="Next"
            disabled={!formValid}
            isLoading={isCheckingAllowance}
            onPress={this.onSubmit}
          />
          <Spacing h={19} />
          {this.renderStreamSummary()}
        </ContentWrapper>
        {this.renderDatePicker(START_TIME)}
        {this.renderDatePicker(END_TIME)}
        <SablierAllowanceModal
          isVisible={isAllowanceModalVisible}
          allowData={allowData}
          onModalHide={this.hideAllowanceModal}
          onAllow={this.onAllowConfirm}
        />
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  assets: { supportedAssets },
}: RootReducerState): $Shape<Props> => ({
  supportedAssets,
});

const structuredSelector = createStructuredSelector({
  activeAccountAddress: activeAccountAddressSelector,
  assets: accountAssetsSelector,
  balances: accountBalancesSelector,
  useGasToken: useGasTokenSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});


export default withTheme(connect(combinedMapStateToProps)(NewStream));
