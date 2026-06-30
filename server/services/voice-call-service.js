import db from '../database/database.js';

class VoiceCallService {
  /**
   * Simulates an outbound AI qualification call for a lead
   * @param {string} leadId 
   * @param {string} userResponseSimulated - 'yes' or 'no' simulated client response
   */
  async simulateOutboundCall(leadId, userResponseSimulated = 'yes') {
    const lead = db.prepare("SELECT * FROM leads WHERE id = ?").get(leadId);
    if (!lead) throw new Error("Lead not found");

    // Update status to calling
    db.prepare("UPDATE leads SET voice_status = 'calling' WHERE id = ?").run(leadId);

    return new Promise((resolve) => {
      setTimeout(() => {
        let transcript = "";
        let finalStatus = "disqualified";

        if (userResponseSimulated === 'yes') {
          transcript = `AI Caller: Hi, am I speaking with ${lead.name}? \n` +
                       `${lead.name}: Yes, speaking. \n` +
                       `AI Caller: Hi, you recently requested an interior design layout and modular quotation for your property in ${lead.location || 'Bangalore'}. Are you actively looking to start your interiors? \n` +
                       `${lead.name}: Yes, actually my flat possession is next month, and I want a modular kitchen and wardrobes done as soon as possible. \n` +
                       `AI Caller: Wonderful! The area is around ${lead.area || 1000} sq ft. I will have a senior designer contact you shortly to close your design brief and layout coordinates. Is that alright? \n` +
                       `${lead.name}: Yes, please. That would be great. \n` +
                       `AI Caller: Perfect! Thank you and have a great day.`;
          finalStatus = "qualified";
        } else {
          transcript = `AI Caller: Hi, am I speaking with ${lead.name}? \n` +
                       `${lead.name}: Yes, who is this? \n` +
                       `AI Caller: Hi, you requested a modular interior design quotation. Are you looking to start your modular work soon? \n` +
                       `${lead.name}: No, I think you have the wrong number or I was just checking. I am not interested. \n` +
                       `AI Caller: Ah, I understand. Thank you for your time.`;
          finalStatus = "disqualified";
        }

        // Update database with transcript and final status
        db.prepare(`
          UPDATE leads 
          SET voice_status = ?, call_transcript = ?, call_recording = ?
          WHERE id = ?
        `).run(
          finalStatus,
          transcript,
          userResponseSimulated === 'yes' ? `/storage/calls/call_${leadId}.mp3` : null,
          leadId
        );

        resolve({
          leadId,
          status: finalStatus,
          transcript,
          recording: userResponseSimulated === 'yes' ? `/storage/calls/call_${leadId}.mp3` : null
        });
      }, 1500); // 1.5s delay to simulate conversation time
    });
  }

  /**
   * Webhook handler for external voice calling APIs like Vapi, Retell, or Bland AI
   * @param {object} webhookData 
   */
  processVoiceWebhook(webhookData) {
    const { leadId, transcript, recordingUrl, callDuration, customerIntent } = webhookData;
    
    let voiceStatus = 'disqualified';
    if (customerIntent === 'positive' || customerIntent === 'needs_interiors') {
      voiceStatus = 'qualified';
    }

    db.prepare(`
      UPDATE leads 
      SET voice_status = ?, call_transcript = ?, call_recording = ?
      WHERE id = ?
    `).run(voiceStatus, transcript, recordingUrl, leadId);

    return { success: true, leadId, voiceStatus };
  }
}

export default new VoiceCallService();
