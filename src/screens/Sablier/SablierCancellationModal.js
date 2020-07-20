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
import { SafeAreaView } from 'react-navigation';
import styled, { withTheme } from 'styled-components/native';
import SlideModal from 'components/Modals/SlideModal';
import { BaseText } from 'components/Typography';
import Button from 'components/Button';
import { Spacing } from 'components/Layout';
import FeeLabelToggle from 'components/FeeLabelToggle';
import { getThemeColors } from 'utils/themes';


const ContentWrapper = styled(SafeAreaView)`
  width: 100%;
  padding-bottom: 40px;
  align-items: center;
`;


const SablierCancellationModal = ({
  isVisible, onModalHide, theme, onCancel, cancelData,
}) => {
  const colors = getThemeColors(theme);

  const { txFeeInWei, gasToken, isDisabled } = cancelData;

  return (
    <SlideModal
      isVisible={isVisible}
      onModalHide={onModalHide}
      noClose
      headerProps={{
        centerItems: [{ icon: 'warning', color: colors.negative, fontSize: 16 }, { title: 'Cancel stream' }],
        sideFlex: '0',
      }}
    >
      <ContentWrapper forceInset={{ top: 'never', bottom: 'always' }}>
        <BaseText medium>
          If you cancel the stream, the money sent to the recipient
          will remain with him, and the rest will be returned to you.
        </BaseText>
        <Spacing h={34} />
        <Button secondary block title="Confirm cancellation" onPress={onCancel} disabled={isDisabled} />
        <Spacing h={8} />
        <Button squarePrimary block title="Do not cancel" onPress={onModalHide} />
        <FeeLabelToggle
          labelText="Fee"
          txFeeInWei={txFeeInWei}
          gasToken={gasToken}
          showFiatDefault
        />
      </ContentWrapper>
    </SlideModal>
  );
};

export default withTheme(SablierCancellationModal);
