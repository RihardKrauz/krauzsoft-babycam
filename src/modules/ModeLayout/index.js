import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';

const styles = () => ({
    button: {
        margin: '1em'
    }
});

const ModeLayout = ({ history, classes }) => {
    function moveToCamView() {
        history.push('/cam');
    }

    function moveToWatcherView() {
        history.push('/watcher');
    }

    return (
        <div>
            <Button variant="outlined" className={classes.button} onClick={moveToCamView}>
                Я камера
            </Button>
            <Button variant="outlined" className={classes.button} onClick={moveToWatcherView}>
                Я смотритель
            </Button>
        </div>
    );
};

ModeLayout.propTypes = {
    classes: PropTypes.object.isRequired
};

export default withStyles(styles)(ModeLayout);
