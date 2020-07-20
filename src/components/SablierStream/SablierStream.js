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
import { Platform } from 'react-native';
import { connect } from 'react-redux';
import styled, { withTheme } from 'styled-components/native';
import { createStructuredSelector } from 'reselect';
import { withNavigation } from 'react-navigation';
import { MediumText, BaseText } from 'components/Typography';
import Progress from 'components/Progress';
import { Spacing } from 'components/Layout';
import Icon from 'components/Icon';
import {
  formatAmount,
  formatUnits,
  getDecimalPlaces,
  countDownDHMS,
} from 'utils/common';
import { getThemeColors, themedColors } from 'utils/themes';
import { activeAccountAddressSelector } from 'selectors';
import { SABLIER_INCOMING_STREAM, SABLIER_OUTGOING_STREAM } from 'constants/navigationConstants';


const Container = styled.TouchableOpacity`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
`;

const TimeContainer = styled.View``;
const AssetContainer = styled.View`
  flex: 1;
`;

const DirectionIcon = styled(Icon)`
  color: ${({ color }) => color};
  text-align: center;
  font-size: 30px;
  margin: ${Platform.OS === 'ios' ? '-15px -7px' : '0 0'};
`;

const DirectionIconWrapper = styled.View`
  background-color: ${themedColors.buttonSecondaryBackground};
  width: 16px;
  height: 16px;
  border-radius: 8px;
  align-items: center;
  justify-content: center;
`;

const AmountContainer = styled.View`
  flex-direction: row;
  align-items: center;
`;
class SablierStream extends React.Component {
  isOutgoingStream = () => {
    const { stream, activeAccountAddress } = this.props;
    return stream.sender === activeAccountAddress.toLowerCase();
  }

  navigateToDetails = () => {
    const { navigation, stream } = this.props;
    const isOutgoingStream = this.isOutgoingStream();
    navigation.navigate(isOutgoingStream ? SABLIER_OUTGOING_STREAM : SABLIER_INCOMING_STREAM, { stream });
  }

  render() {
    const { stream, theme } = this.props;
    const { token } = stream;
    const formattedAmount = formatAmount(formatUnits(stream.deposit, 18), getDecimalPlaces(token.symbol));

    const streamDuration = stream.stopTime - stream.startTime; // in seconds
    const now = Math.round(new Date().getTime() / 1000);
    const streamProgress = Math.min(1, (now - stream.startTime) / streamDuration);

    const colors = getThemeColors(theme);

    const streamEnded = stream.stopTime < now;

    const { days, hours, minutes } = countDownDHMS((stream.stopTime - now) * 1000);
    let remainingTimeString = '';
    if (days > 0) {
      remainingTimeString = `${days}d ${hours}h`;
    } else {
      remainingTimeString = `${hours}h ${minutes}m`;
    }

    const isOutgoing = this.isOutgoingStream();
    const progressBarColor = isOutgoing ? colors.negative : colors.positive;
    const directionIconName = isOutgoing ? 'sent' : 'received';

    return (
      <Container onPress={this.navigateToDetails}>
        <AssetContainer>
          <AmountContainer>
            <DirectionIconWrapper>
              <DirectionIcon name={directionIconName} color={progressBarColor} />
            </DirectionIconWrapper>
            <Spacing w={6} />
            <MediumText big>{formattedAmount} {token.symbol}</MediumText>
          </AmountContainer>
          <Spacing h={15} />
          <Progress
            fullStatusValue={1}
            currentStatusValue={streamProgress}
            colorStart={progressBarColor}
            colorEnd={progressBarColor}
            height={4}
            barPadding={0}
            emptyBarBackgroundColor={colors.tertiary}
          />
        </AssetContainer>
        <Spacing w={44} />
        <TimeContainer>
          {streamEnded ? (
            <BaseText regular secondary>Ended</BaseText>
            ) : (
              <>
                <BaseText big>{remainingTimeString}</BaseText>
                <BaseText regular secondary>Remaining</BaseText>
              </>
            )}

        </TimeContainer>
      </Container>
    );
  }
}

const structuredSelector = createStructuredSelector({
  activeAccountAddress: activeAccountAddressSelector,
});

export default withNavigation(withTheme(connect(structuredSelector)(SablierStream)));
