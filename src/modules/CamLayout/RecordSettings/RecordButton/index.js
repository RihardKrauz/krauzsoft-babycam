import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import Videocam from '@material-ui/icons/VideocamOutlined';
import VideocamOff from '@material-ui/icons/VideocamOffOutlined';

const recordButtonStyles = () => ({
    iconWrapper: {
        padding: '0.2em'
    }
});

const RecordButton = ({ isRecording, onStartRecord, onStopRecord, classes }) => {
    return !isRecording ? (
        <IconButton className={classes.iconWrapper} color="default" onClick={onStartRecord}>
            <VideocamOff />
        </IconButton>
    ) : (
        <IconButton className={classes.iconWrapper} color="secondary" onClick={onStopRecord}>
            <Videocam />
        </IconButton>
    );
};

RecordButton.propTypes = {
    isRecording: PropTypes.bool,
    onStartRecord: PropTypes.func,
    onStopRecord: PropTypes.func,
    classes: PropTypes.object
};

export default withStyles(recordButtonStyles)(RecordButton);
