import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';

const namePanelStyles = () => ({
    container: {
        display: 'flex'
    },
    actionContainer: {
        marginTop: '1em'
    },
    actionButton: {
        margin: '1em'
    },
})

const CameraNamePanel = ({ camName, setCamName, onApply, classes }) => {
    return (
        <div className={classes.container}>
            <div>
                <TextField
                    label="Камера"
                    value={camName}
                    onChange={e => setCamName(e.target.value)}
                    margin="normal"
                />
            </div>
            <div className={classes.actionContainer}>
                <Button className={classes.actionButton} onClick={onApply}>
                    Сохранить
                </Button>
            </div>
        </div>
    );
};

CameraNamePanel.propTypes = {
    camName: PropTypes.string,
    setCamName: PropTypes.func,
    onApply: PropTypes.func,
    classes: PropTypes.object
};

export default withStyles(namePanelStyles)(CameraNamePanel);