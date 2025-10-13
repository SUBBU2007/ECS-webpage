const express = require('express');
const router = express.Router();
const { supabase } = require('../index');

// GET /api/token/status - Fetch the current status of all counters
router.get('/status', async (req, res) => {
  try {
    // Fetch all counters and their associated camera data
    const { data: counters, error: countersError } = await supabase
      .from('counters')
      .select(`
        id,
        name,
        description,
        is_active,
        current_token_id,
        camera_data (
          people_count,
          estimated_wait_time
        )
      `);

    if (countersError) throw countersError;

    // For each counter, fetch the list of waiting tokens
    const countersWithQueues = await Promise.all(
      counters.map(async (counter) => {
        const { data: queue, error: queueError } = await supabase
          .from('tokens')
          .select('id, token_number, status, created_at')
          .eq('counter_id', counter.id)
          .eq('status', 'waiting')
          .order('created_at', { ascending: true });

        if (queueError) throw queueError;

        // Safely access camera_data
        const cameraData = counter.camera_data && counter.camera_data.length > 0 ? counter.camera_data[0] : { people_count: 0, estimated_wait_time: 0 };

        return {
          ...counter,
          camera_data: cameraData,
          queue,
        };
      })
    );

    res.json(countersWithQueues);
  } catch (error) {
    console.error('Error fetching token status:', error);
    res.status(500).json({ error: 'An error occurred while fetching queue status.' });
  }
});


// POST /api/token/create - Create a new token for a specified counter
router.post('/create', async (req, res) => {
  const { counterId } = req.body;

  if (!counterId) {
    return res.status(400).json({ error: 'counterId is required' });
  }

  try {
    // 1. Find the latest token number for this counter
    const { data: lastToken, error: lastTokenError } = await supabase
      .from('tokens')
      .select('token_number')
      .eq('counter_id', counterId)
      .order('token_number', { ascending: false })
      .limit(1)
      .single();

    if (lastTokenError && lastTokenError.code !== 'PGRST116') { // Ignore 'not found' error
      throw lastTokenError;
    }

    const newTokenNumber = lastToken ? lastToken.token_number + 1 : 1;

    // 2. Create the new token
    const { data: newToken, error: createTokenError } = await supabase
      .from('tokens')
      .insert({
        counter_id: counterId,
        token_number: newTokenNumber,
        status: 'waiting',
      })
      .select()
      .single();

    if (createTokenError) throw createTokenError;

    // Broadcast the change
    try {
      const channel = supabase.channel('qms-channel');
      // Note: The Supabase client doesn't need to 'subscribe' to 'send' messages.
      await channel.send({
        type: 'broadcast',
        event: 'DB_CHANGE',
        payload: { message: 'Data has changed' },
      });
    } catch (broadcastError) {
      console.error('Error broadcasting new token event:', broadcastError);
      // Non-critical error, so we just log it and don't fail the request.
    }

    res.status(201).json(newToken);
  } catch (error) {
    console.error('Error creating token:', error);
    res.status(500).json({ error: 'An error occurred while creating the token.' });
  }
});

// POST /api/token/serve/:counterId - Serve the next token for a given counter
router.post('/serve/:counterId', async (req, res) => {
  const { counterId } = req.params;

  try {
    // 1. Find the next token in the 'waiting' queue for this counter
    const { data: nextToken, error: findTokenError } = await supabase
      .from('tokens')
      .select('id, token_number')
      .eq('counter_id', counterId)
      .eq('status', 'waiting')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (findTokenError || !nextToken) {
      // If no token is waiting, update the counter's current_token_id to null
      const { error: updateCounterError } = await supabase
        .from('counters')
        .update({ current_token_id: null })
        .eq('id', counterId);

      if (updateCounterError) throw updateCounterError;
      return res.status(404).json({ message: 'No tokens are waiting in the queue.' });
    }

    // 2. Update the token's status to 'serving'
    const { data: servedToken, error: updateTokenError } = await supabase
      .from('tokens')
      .update({ status: 'serving', served_at: new Date() })
      .eq('id', nextToken.id)
      .select()
      .single();

    if (updateTokenError) throw updateTokenError;

    // 3. Update the counter's current_token_id to the served token's ID
    const { error: updateCounterError } = await supabase
      .from('counters')
      .update({ current_token_id: servedToken.id })
      .eq('id', counterId);

    if (updateCounterError) throw updateCounterError;

    // Broadcast the change
    try {
      const channel = supabase.channel('qms-channel');
      await channel.send({
        type: 'broadcast',
        event: 'DB_CHANGE',
        payload: { message: 'Data has changed' },
      });
    } catch (broadcastError) {
      console.error('Error broadcasting serve next event:', broadcastError);
      // Non-critical error
    }

    res.json(servedToken);
  } catch (error) {
    console.error('Error serving next token:', error);
    res.status(500).json({ error: 'An error occurred while serving the next token.' });
  }
});


module.exports = router;
