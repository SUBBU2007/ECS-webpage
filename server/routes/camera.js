const express = require('express');
const router = express.Router();
const { supabase } = require('../index');

// POST /api/camera/update - Update camera data for a specific counter
router.post('/update', async (req, res) => {
  const { counterId, peopleCount, estimatedTime } = req.body;

  if (counterId === undefined || peopleCount === undefined || estimatedTime === undefined) {
    return res.status(400).json({ error: 'counterId, peopleCount, and estimatedTime are required' });
  }

  try {
    // Upsert the camera data for the given counterId.
    // Upsert will create a new row if one doesn't exist for the counterId,
    // or update the existing one if it does.
    const { data, error } = await supabase
      .from('camera_data')
      .update({
        people_count: peopleCount,
        estimated_wait_time: estimatedTime,
        // updated_at is handled by the database trigger
      })
      .eq('counter_id', counterId)
      .select()
      .single();


    if (error) {
       // If the update fails because the row doesn't exist, create it
      if (error.code === 'PGRST116') {
        const { data: newData, error: insertError } = await supabase
          .from('camera_data')
          .insert({
            counter_id: counterId,
            people_count: peopleCount,
            estimated_wait_time: estimatedTime,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Broadcast the change after insert
        try {
          const channel = supabase.channel('qms-channel');
          await channel.send({
            type: 'broadcast',
            event: 'DB_CHANGE',
            payload: { message: 'Data has changed' },
          });
        } catch (broadcastError) {
          console.error('Error broadcasting camera update event:', broadcastError);
        }

        return res.status(201).json(newData);
      }
      throw error;
    }

    // Broadcast the change after update
    try {
      const channel = supabase.channel('qms-channel');
      await channel.send({
        type: 'broadcast',
        event: 'DB_CHANGE',
        payload: { message: 'Data has changed' },
      });
    } catch (broadcastError) {
      console.error('Error broadcasting camera update event:', broadcastError);
    }

    res.json(data);
  } catch (error) {
    console.error('Error updating camera data:', error);
    res.status(500).json({ error: 'An error occurred while updating camera data.' });
  }
});

module.exports = router;
