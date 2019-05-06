import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import DirectionsRun from '@material-ui/icons/DirectionsRun';
import IconButton from '@material-ui/core/IconButton';
import TextField from '@material-ui/core/TextField';
import Checkbox from '@material-ui/core/Checkbox';
import RecordButton from './RecordButton';

const recordSettingsStyles = () => ({
    container: {
        display: 'flex',
        opacity: '1'
    },
    hiddenContainer: {
        opacity: '0'
    },
    field: {
        width: '100px'
    },
    toggleTitle: {
        fontSize: '12px',
        color: 'rgba(0, 0, 0, 0.54)',
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        marginTop: '1.3em'
    },
    recordButtonWrapper: {
        marginTop: '2.3em',
        marginLeft: '1em'
    },
    iconWrapper: { padding: '0.2em', marginLeft: '0.5em' }
});

const RecordSettings = ({
    isRecording,
    onStartRecord,
    onStopRecord,
    sensivity,
    setSensivityAction,
    setTrackRecordingAction,
    isMoveSpotted,
    isVisible,
    classes
}) => {
    return (
        <div
            className={classNames(classes.container, {
                [classes.hiddenContainer]: isVisible === false
            })}
        >
            <div>
                <TextField
                    id="standard-required"
                    label="Sensivity"
                    className={classes.field}
                    value={sensivity}
                    onChange={setSensivityAction}
                    margin="normal"
                />
            </div>
            <div>
                <div className={classes.toggleTitle}>SaveOnMotion</div>
                <Checkbox id="cb-required" onChange={setTrackRecordingAction} margin="normal" />
            </div>
            <div className={classes.recordButtonWrapper}>
                <RecordButton isRecording={isRecording} onStartRecord={onStartRecord} onStopRecord={onStopRecord} />
                {isMoveSpotted && (
                    <IconButton className={classes.iconWrapper} color="primary">
                        <DirectionsRun />
                    </IconButton>
                )}
            </div>
        </div>
    );
};

RecordSettings.propTypes = {
    isRecording: PropTypes.bool,
    onStartRecord: PropTypes.func,
    onStopRecord: PropTypes.func,
    sensivity: PropTypes.any,
    setSensivityAction: PropTypes.func,
    setTrackRecordingAction: PropTypes.func,
    isMoveSpotted: PropTypes.bool,
    isVisible: PropTypes.bool,
    classes: PropTypes.object
};

export default withStyles(recordSettingsStyles)(RecordSettings);
